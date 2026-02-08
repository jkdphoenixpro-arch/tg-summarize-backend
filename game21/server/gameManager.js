import Player from './models/Player.js';
import { isDatabaseConnected } from './database.js';

export class GameManager {
  constructor(redis) {
    this.redis = redis;
    this.MIN_BET = 20;
    this.MAX_BET = 300;
  }

  async createGame() {
    const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const game = {
      id: gameId,
      players: [],
      status: 'waiting', // waiting, playing, finished
      deck: this.createDeck(),
      currentPlayerIndex: 0,
      dealer: { cards: [], score: 0 },
      createdAt: Date.now()
    };
    
    await this.redis.set(`game:${gameId}`, JSON.stringify(game), { EX: 3600 });
    return gameId;
  }

  createDeck() {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck = [];
    
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({ suit, rank });
      }
    }
    
    return this.shuffleDeck(deck);
  }

  shuffleDeck(deck) {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  calculateScore(cards) {
    let score = 0;
    let aces = 0;
    
    for (const card of cards) {
      if (card.rank === 'A') {
        aces++;
        score += 11;
      } else if (['J', 'Q', 'K'].includes(card.rank)) {
        score += 10;
      } else {
        score += parseInt(card.rank);
      }
    }
    
    while (score > 21 && aces > 0) {
      score -= 10;
      aces--;
    }
    
    return score;
  }

  async getGameState(gameId) {
    const data = await this.redis.get(`game:${gameId}`);
    return data ? JSON.parse(data) : null;
  }

  async saveGameState(game) {
    await this.redis.set(`game:${game.id}`, JSON.stringify(game), { EX: 3600 });
  }

  async joinGame(gameId, userId, username, photoUrl, bet = 20) {
    const game = await this.getGameState(gameId);
    
    if (!game) {
      return { success: false, error: 'Игра не найдена' };
    }
    
    // Проверяем есть ли игрок уже в игре
    const existingPlayer = game.players.find(p => p.userId === userId);
    
    if (existingPlayer) {
      // Игрок уже в игре - разрешаем переподключение
      console.log(`🔄 Игрок ${username} переподключается к игре ${gameId}`);
      return { success: true, reconnected: true };
    }
    
    // Новый игрок может присоединиться только если игра ещё не началась
    if (game.status !== 'waiting') {
      return { success: false, error: 'Игра уже началась' };
    }
    
    if (game.players.length >= 6) {
      return { success: false, error: 'Игра заполнена (макс. 6 игроков)' };
    }

    // Проверяем ставку
    if (bet < this.MIN_BET) {
      return { success: false, error: `Минимальная ставка ${this.MIN_BET}₽` };
    }
    
    if (bet > this.MAX_BET) {
      return { success: false, error: `Максимальная ставка ${this.MAX_BET}₽` };
    }

    // Проверяем баланс игрока в MongoDB (если подключена)
    let playerBalance = 1000; // Дефолтный баланс
    if (isDatabaseConnected()) {
      try {
        const player = await Player.getOrCreate(userId, username);
        playerBalance = player.balance;
        
        if (!player.canBet(bet)) {
          return { 
            success: false, 
            error: `Недостаточно средств. Баланс: ${player.balance}₽` 
          };
        }
      } catch (error) {
        console.error('Ошибка проверки баланса:', error);
        // Продолжаем без проверки баланса если MongoDB недоступна
      }
    }
    
    // Добавляем нового игрока
    game.players.push({
      userId,
      username,
      photoUrl,
      cards: [],
      score: 0,
      status: 'active', // active, stand, busted
      bet: bet,
      balance: playerBalance
    });
    
    await this.saveGameState(game);
    console.log(`✅ ${username} присоединился к игре со ставкой ${bet}₽`);
    return { success: true, reconnected: false };
  }

  async startGame(gameId, userId) {
    const game = await this.getGameState(gameId);
    
    if (!game) {
      return { success: false, error: 'Игра не найдена' };
    }
    
    if (game.players.length < 2) {
      return { success: false, error: 'Нужно минимум 2 игрока' };
    }
    
    if (game.status !== 'waiting') {
      return { success: false, error: 'Игра уже началась' };
    }
    
    game.status = 'playing';
    game.currentPlayerIndex = 0;
    
    // Раздаем по 2 карты каждому игроку
    for (const player of game.players) {
      player.cards = [game.deck.pop(), game.deck.pop()];
      player.score = this.calculateScore(player.cards);
    }
    
    // Дилеру 2 карты (одна скрыта)
    game.dealer.cards = [game.deck.pop(), game.deck.pop()];
    game.dealer.score = this.calculateScore([game.dealer.cards[0]]);
    
    await this.saveGameState(game);
    return { success: true };
  }

  async hit(gameId, userId) {
    const game = await this.getGameState(gameId);
    
    if (!game || game.status !== 'playing') {
      return { success: false };
    }
    
    const player = game.players.find(p => p.userId === userId);
    if (!player || player.status !== 'active') {
      return { success: false };
    }
    
    const currentPlayer = game.players[game.currentPlayerIndex];
    if (currentPlayer.userId !== userId) {
      return { success: false, error: 'Не ваш ход' };
    }
    
    player.cards.push(game.deck.pop());
    player.score = this.calculateScore(player.cards);
    
    let busted = false;
    if (player.score > 21) {
      player.status = 'busted';
      busted = true;
      await this.moveToNextPlayer(game);
    }
    
    await this.saveGameState(game);
    return { success: true, busted };
  }

  async stand(gameId, userId) {
    const game = await this.getGameState(gameId);
    
    if (!game || game.status !== 'playing') {
      return { success: false };
    }
    
    const player = game.players.find(p => p.userId === userId);
    if (!player || player.status !== 'active') {
      return { success: false };
    }
    
    player.status = 'stand';
    const gameOver = await this.moveToNextPlayer(game);
    
    await this.saveGameState(game);
    return { success: true, gameOver };
  }

  async moveToNextPlayer(game) {
    game.currentPlayerIndex++;
    
    // Пропускаем игроков которые уже завершили ход
    while (game.currentPlayerIndex < game.players.length) {
      const player = game.players[game.currentPlayerIndex];
      if (player.status === 'active') {
        return false;
      }
      game.currentPlayerIndex++;
    }
    
    // Все игроки завершили - ход дилера
    await this.dealerTurn(game);
    await this.determineWinners(game);
    game.status = 'finished';
    
    return true;
  }

  async dealerTurn(game) {
    game.dealer.score = this.calculateScore(game.dealer.cards);
    
    while (game.dealer.score < 17) {
      game.dealer.cards.push(game.deck.pop());
      game.dealer.score = this.calculateScore(game.dealer.cards);
    }
  }

  async determineWinners(game) {
    const dealerScore = game.dealer.score;
    const dealerBusted = dealerScore > 21;
    
    for (const player of game.players) {
      if (player.status === 'busted') {
        player.result = 'lose';
      } else if (dealerBusted) {
        player.result = 'win';
      } else if (player.score > dealerScore) {
        player.result = 'win';
      } else if (player.score === dealerScore) {
        player.result = 'push';
      } else {
        player.result = 'lose';
      }

      // Сохраняем результат в MongoDB и обновляем баланс
      if (isDatabaseConnected()) {
        try {
          const dbPlayer = await Player.findOne({ userId: player.userId });
          if (dbPlayer) {
            await dbPlayer.updateAfterGame(player.result, player.bet);
            // Обновляем баланс в gameState
            player.balance = dbPlayer.balance;
          }
        } catch (error) {
          console.error(`Ошибка сохранения результата для ${player.username}:`, error);
        }
      } else {
        // Если MongoDB не подключена, обновляем баланс локально
        if (player.result === 'win') {
          player.balance = (player.balance || 1000) + player.bet;
        } else if (player.result === 'lose') {
          player.balance = (player.balance || 1000) - player.bet;
        }
        // При push баланс не меняется
      }
    }
  }
}
