import Player from './models/Player.js';
import { isDatabaseConnected } from './database.js';

export class GameManager {
  constructor(redis, io = null, startGameInterval = null, botEvents = null) {
    this.redis = redis;
    this.io = io; // Socket.io instance для отправки событий
    this.startGameInterval = startGameInterval; // Функция для запуска интервала
    this.botEvents = botEvents; // EventEmitter для связи с ботом
    this.MIN_BET = 20;
    this.MAX_BET = 300;
    this.TURN_TIMEOUT = 30000; // 30 секунд на ход
    this.AUTO_START_TIMEOUT = 120000; // 120 секунд до автостарта
    this.MAX_AUTO_START_TIMEOUT = 180000; // Максимум 180 секунд
    this.EXTEND_COOLDOWN = 5000; // Кулдаун между продлениями 5 секунд
    this.turnTimers = new Map(); // Хранилище таймеров для каждой игры
    this.autoStartTimers = new Map(); // Хранилище таймеров автостарта
  }

  async createGame(gameType = 'blackjack', chatId = null) {
    const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const game = {
      id: gameId,
      gameType: gameType, // 'blackjack' или 'pvp'
      chatId: chatId, // ID чата где создана игра
      players: [],
      status: 'waiting', // waiting, playing, finished
      deck: this.createDeck(),
      currentPlayerIndex: 0,
      dealer: gameType === 'blackjack' ? { cards: [], score: 0 } : null,
      creator: null, // ID создателя (первый присоединившийся)
      autoStartTime: null, // Время автостарта
      lastExtendTime: null, // Время последнего продления
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

        // Списываем ставку сразу при присоединении
        player.balance -= bet;
        await player.save();
        playerBalance = player.balance;
        console.log(`💰 Списано ${bet}₽ с баланса ${username}. Новый баланс: ${playerBalance}₽`);
      } catch (error) {
        console.error('Ошибка проверки баланса:', error);
        // Продолжаем без проверки баланса если MongoDB недоступна
      }
    } else {
      // Если MongoDB не подключена, вычитаем локально
      playerBalance -= bet;
    }

    // Устанавливаем создателя (первый присоединившийся)
    if (game.players.length === 0) {
      game.creator = userId;
      console.log(`👑 ${username} стал создателем игры ${gameId}`);
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

    // Запускаем таймер автостарта если это второй игрок
    if (game.players.length === 2 && !game.autoStartTime) {
      game.autoStartTime = Date.now() + this.AUTO_START_TIMEOUT;
      await this.saveGameState(game);
      this.startAutoStartTimer(gameId);
      console.log(`⏰ Запущен таймер автостарта для игры ${gameId} (120 секунд)`);
    } else {
      await this.saveGameState(game);
    }

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

    // Проверяем что это создатель игры
    if (game.creator && game.creator !== userId) {
      return { success: false, error: 'Только создатель может начать игру' };
    }

    // Останавливаем таймер автостарта
    this.clearAutoStartTimer(gameId);

    game.status = 'playing';
    game.currentPlayerIndex = 0;

    // Очищаем старое время хода (если было)
    delete game.turnStartTime;

    // Раздаем по 2 карты каждому игроку
    for (const player of game.players) {
      player.cards = [game.deck.pop(), game.deck.pop()];
      player.score = this.calculateScore(player.cards);
    }

    // Дилеру 2 карты только в режиме blackjack
    if (game.gameType === 'blackjack') {
      game.dealer.cards = [game.deck.pop(), game.deck.pop()];
      game.dealer.score = this.calculateScore([game.dealer.cards[0]]);
    }

    // Устанавливаем время начала хода для первого игрока СЕЙЧАС
    game.turnStartTime = Date.now();

    console.log(`⏱️ Установлено turnStartTime для игры ${gameId}: ${game.turnStartTime}`);

    await this.saveGameState(game);

    // Запускаем таймер для первого игрока
    this.startTurnTimer(gameId);

    console.log(`🎮 Игра ${gameId} началась!`);
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

    // Останавливаем таймер текущего хода
    this.clearTurnTimer(gameId);

    player.cards.push(game.deck.pop());
    player.score = this.calculateScore(player.cards);

    let busted = false;
    if (player.score > 21) {
      player.status = 'busted';
      busted = true;
      await this.moveToNextPlayer(game);
    } else {
      // Если игрок не перебрал, обновляем время начала хода
      game.turnStartTime = Date.now();
      // И запускаем таймер снова
      this.startTurnTimer(gameId);
    }

    await this.saveGameState(game);
    return { success: true, busted };
  }

  async stand(gameId, userId, isTimeout = false) {
    const game = await this.getGameState(gameId);

    if (!game || game.status !== 'playing') {
      return { success: false };
    }

    const player = game.players.find(p => p.userId === userId);
    if (!player || player.status !== 'active') {
      return { success: false };
    }

    // Останавливаем таймер текущего хода
    this.clearTurnTimer(gameId);

    player.status = 'stand';
    const gameOver = await this.moveToNextPlayer(game);

    await this.saveGameState(game);
    return { success: true, gameOver, isTimeout };
  }

  async moveToNextPlayer(game) {
    // Останавливаем таймер предыдущего игрока
    this.clearTurnTimer(game.id);

    game.currentPlayerIndex++;

    // Пропускаем игроков которые уже завершили ход
    while (game.currentPlayerIndex < game.players.length) {
      const player = game.players[game.currentPlayerIndex];
      if (player.status === 'active') {
        // Устанавливаем время начала хода для следующего игрока
        game.turnStartTime = Date.now();
        // Запускаем таймер для следующего игрока
        this.startTurnTimer(game.id);
        return false;
      }
      game.currentPlayerIndex++;
    }

    // Все игроки завершили
    if (game.gameType === 'blackjack') {
      // В блекджеке - ход дилера
      await this.dealerTurn(game);
    }
    // В обоих режимах определяем победителей
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
    if (game.gameType === 'blackjack') {
      // Режим блекджек - игроки против дилера
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
      }
    } else {
      // Режим PvP - игроки друг против друга
      // Находим максимальный счет среди не перебравших игроков
      let maxScore = 0;
      const activePlayers = game.players.filter(p => p.status !== 'busted');

      for (const player of activePlayers) {
        if (player.score > maxScore) {
          maxScore = player.score;
        }
      }

      // Определяем победителей
      for (const player of game.players) {
        if (player.status === 'busted') {
          player.result = 'lose';
        } else if (player.score === maxScore) {
          // Проверяем сколько игроков с таким же счетом
          const winnersCount = activePlayers.filter(p => p.score === maxScore).length;
          if (winnersCount === 1) {
            player.result = 'win';
          } else {
            player.result = 'push'; // Ничья между несколькими игроками
          }
        } else {
          player.result = 'lose';
        }
      }
    }

    // Сохраняем результат в MongoDB и обновляем баланс
    for (const player of game.players) {
      if (isDatabaseConnected()) {
        try {
          const dbPlayer = await Player.findOne({ userId: player.userId });
          if (dbPlayer) {
            // Ставка уже списана при присоединении
            // Теперь добавляем выигрыш или возвращаем ставку
            if (player.result === 'win') {
              // Возвращаем ставку + выигрыш
              dbPlayer.balance += player.bet * 2;
              dbPlayer.gamesWon += 1;
            } else if (player.result === 'push') {
              // Возвращаем ставку
              dbPlayer.balance += player.bet;
            }
            // При lose ничего не делаем - ставка уже списана

            dbPlayer.gamesPlayed += 1;
            await dbPlayer.save();

            // Обновляем баланс в gameState
            player.balance = dbPlayer.balance;
            console.log(`💰 ${player.username} ${player.result}: баланс ${player.balance}₽`);
          }
        } catch (error) {
          console.error(`Ошибка сохранения результата для ${player.username}:`, error);
        }
      } else {
        // Если MongoDB не подключена, обновляем баланс локально
        // Ставка уже списана при присоединении
        if (player.result === 'win') {
          // Возвращаем ставку + выигрыш
          player.balance += player.bet * 2;
        } else if (player.result === 'push') {
          // Возвращаем ставку
          player.balance += player.bet;
        }
        // При lose ничего не делаем - ставка уже списана
      }
    }

    // ВАЖНО: Очищаем таймер после завершения игры
    this.clearTurnTimer(game.id);
    console.log(`🧹 Игра ${game.id} завершена, ресурсы очищены`);
    
    // Отправляем результаты в чат через 2 секунды
    if (game.chatId) {
      setTimeout(async () => {
        const winners = game.players.filter(p => p.result === 'win');
        const losers = game.players.filter(p => p.result === 'lose');
        const totalPot = game.players.reduce((sum, p) => sum + p.bet, 0);
        
        const payload = {
          chatId: game.chatId,
          gameType: game.gameType,
          results: {
            winners: winners.map(p => ({
              username: p.username,
              score: p.score,
              bet: p.bet,
              winAmount: p.bet * 2
            })),
            losers: losers.map(p => ({
              username: p.username,
              score: p.score,
              bet: p.bet
            })),
            totalPot: totalPot
          }
        };
        
        // Отправляем HTTP запрос к боту
        try {
          const botApiUrl = process.env.BOT_API_URL || 'http://localhost:3002';
          const response = await fetch(`${botApiUrl}/api/game-finished`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          
          if (response.ok) {
            console.log(`✅ HTTP: Результаты отправлены боту для чата ${game.chatId}`);
          } else {
            console.error(`❌ HTTP: Ошибка отправки результатов: ${response.status}`);
          }
        } catch (error) {
          console.error(`❌ HTTP: Не удалось отправить результаты боту:`, error.message);
        }
        
        // Также отправляем через EventEmitter (для локальной разработки)
        if (this.botEvents) {
          this.botEvents.emit('game_finished', payload);
          console.log(`📢 EventEmitter: Событие game_finished отправлено для чата ${game.chatId}`);
        }
      }, 2000);
    }
  }

  // Методы управления таймерами
  startTurnTimer(gameId) {
    // Очищаем предыдущий таймер если есть
    this.clearTurnTimer(gameId);

    const timer = setTimeout(async () => {
      console.log(`⏰ Время вышло для игры ${gameId}`);
      await this.handleTurnTimeout(gameId);
    }, this.TURN_TIMEOUT);

    this.turnTimers.set(gameId, timer);
    console.log(`⏱️ Таймер запущен для игры ${gameId} (30 секунд)`);
  }

  clearTurnTimer(gameId) {
    const timer = this.turnTimers.get(gameId);
    if (timer) {
      clearTimeout(timer);
      this.turnTimers.delete(gameId);
      console.log(`⏹️ Таймер остановлен для игры ${gameId}`);
    }
  }

  async handleTurnTimeout(gameId) {
    const game = await this.getGameState(gameId);

    if (!game || game.status !== 'playing') {
      return;
    }

    const currentPlayer = game.players[game.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.status !== 'active') {
      return;
    }

    console.log(`⏰ Автоматический пас для игрока ${currentPlayer.username}`);

    // Автоматически делаем stand для игрока
    currentPlayer.status = 'stand';
    const gameOver = await this.moveToNextPlayer(game);

    await this.saveGameState(game);

    // Отправляем обновление через socket.io если доступно
    if (this.io) {
      this.io.to(gameId).emit('turn_timeout', {
        userId: currentPlayer.userId,
        username: currentPlayer.username
      });

      const updatedGame = await this.getGameState(gameId);
      const remainingTime = this.getRemainingTime(updatedGame);
      this.io.to(gameId).emit('game_update', {
        ...updatedGame,
        remainingTime
      });

      if (gameOver) {
        this.io.to(gameId).emit('game_over', updatedGame);
      }
    }

    // Возвращаем результат для отправки через socket
    return {
      success: true,
      gameOver,
      isTimeout: true,
      userId: currentPlayer.userId,
      gameState: game
    };
  }

  // Метод для получения оставшегося времени хода
  getRemainingTime(game) {
    if (!game.turnStartTime || game.status !== 'playing') {
      return 0;
    }

    const elapsed = Date.now() - game.turnStartTime;
    const remaining = Math.max(0, this.TURN_TIMEOUT - elapsed);
    const remainingSeconds = Math.ceil(remaining / 1000);

    // Логируем только если время странное
    if (remainingSeconds < 25 && elapsed < 5000) {
      console.log(`⚠️ Странное время: elapsed=${elapsed}ms, remaining=${remainingSeconds}s, turnStartTime=${game.turnStartTime}, now=${Date.now()}`);
    }

    return remainingSeconds; // Возвращаем в секундах
  }

  // Методы управления таймером автостарта
  startAutoStartTimer(gameId) {
    // Очищаем предыдущий таймер если есть
    this.clearAutoStartTimer(gameId);

    const timer = setTimeout(async () => {
      console.log(`⏰ Автостарт игры ${gameId}`);
      await this.handleAutoStart(gameId);
    }, this.AUTO_START_TIMEOUT);

    this.autoStartTimers.set(gameId, timer);
    console.log(`⏱️ Таймер автостарта запущен для игры ${gameId} (120 секунд)`);
  }

  clearAutoStartTimer(gameId) {
    const timer = this.autoStartTimers.get(gameId);
    if (timer) {
      clearTimeout(timer);
      this.autoStartTimers.delete(gameId);
      console.log(`⏹️ Таймер автостарта остановлен для игры ${gameId}`);
    }
  }

  async handleAutoStart(gameId) {
    const game = await this.getGameState(gameId);

    if (!game || game.status !== 'waiting') {
      return;
    }

    if (game.players.length < 2) {
      console.log(`⚠️ Недостаточно игроков для автостарта игры ${gameId}`);
      return;
    }

    console.log(`🎮 Автостарт игры ${gameId} с ${game.players.length} игроками`);

    // Запускаем игру (используем ID создателя для логов, но проверку пропускаем)
    game.status = 'playing';
    game.currentPlayerIndex = 0;

    // Очищаем старое время хода (если было)
    delete game.turnStartTime;

    // Раздаем по 2 карты каждому игроку
    for (const player of game.players) {
      player.cards = [game.deck.pop(), game.deck.pop()];
      player.score = this.calculateScore(player.cards);
    }

    // Дилеру 2 карты только в режиме blackjack
    if (game.gameType === 'blackjack') {
      game.dealer.cards = [game.deck.pop(), game.deck.pop()];
      game.dealer.score = this.calculateScore([game.dealer.cards[0]]);
    }

    // Устанавливаем время начала хода для первого игрока СЕЙЧАС
    game.turnStartTime = Date.now();

    console.log(`⏱️ Установлено turnStartTime для автостарта игры ${gameId}: ${game.turnStartTime}`);

    await this.saveGameState(game);

    // Запускаем таймер для первого игрока
    this.startTurnTimer(gameId);

    // Отправляем обновление через socket.io
    if (this.io) {
      // Вычисляем remainingTime для отправки
      const remainingTime = this.getRemainingTime(game);
      const autoStartRemaining = this.getAutoStartRemainingTime(game);

      this.io.to(gameId).emit('game_started', {
        ...game,
        remainingTime,
        autoStartRemaining
      });
      this.io.to(gameId).emit('auto_start_triggered', {
        message: 'Игра началась автоматически'
      });

      // ВАЖНО: Запускаем интервал для обновления таймера!
      if (this.startGameInterval) {
        this.startGameInterval(gameId);
        console.log(`🔄 Интервал запущен для автостарта игры ${gameId}`);
      }
    }
  }

  // Метод для продления времени автостарта
  async extendAutoStart(gameId, userId) {
    const game = await this.getGameState(gameId);

    if (!game) {
      return { success: false, error: 'Игра не найдена' };
    }

    if (game.status !== 'waiting') {
      return { success: false, error: 'Игра уже началась' };
    }

    // Проверяем что это создатель
    if (game.creator !== userId) {
      return { success: false, error: 'Только создатель может продлить время' };
    }

    // Проверяем кулдаун (5 секунд между продлениями)
    if (game.lastExtendTime && Date.now() - game.lastExtendTime < this.EXTEND_COOLDOWN) {
      const remainingCooldown = Math.ceil((this.EXTEND_COOLDOWN - (Date.now() - game.lastExtendTime)) / 1000);
      return { success: false, error: `Подождите ${remainingCooldown}с` };
    }

    // Проверяем максимальное время
    const currentRemaining = game.autoStartTime - Date.now();
    const newRemaining = currentRemaining + 30000; // +30 секунд

    if (newRemaining > this.MAX_AUTO_START_TIMEOUT) {
      return { success: false, error: 'Достигнут максимум времени (180 секунд)' };
    }

    // Продлеваем время
    game.autoStartTime = Date.now() + newRemaining;
    game.lastExtendTime = Date.now();

    await this.saveGameState(game);

    // Перезапускаем таймер
    this.clearAutoStartTimer(gameId);
    const timer = setTimeout(async () => {
      await this.handleAutoStart(gameId);
    }, newRemaining);
    this.autoStartTimers.set(gameId, timer);

    console.log(`⏰ Время автостарта продлено на 30 секунд для игры ${gameId}`);

    return { success: true, newTime: game.autoStartTime };
  }

  // Метод для получения оставшегося времени до автостарта
  getAutoStartRemainingTime(game) {
    if (!game.autoStartTime || game.status !== 'waiting') {
      return 0;
    }

    const remaining = Math.max(0, game.autoStartTime - Date.now());
    return Math.ceil(remaining / 1000); // Возвращаем в секундах
  }

  // Метод для полной очистки игры (вызывается при завершении)
  async cleanupGame(gameId) {
    // Очищаем таймеры
    this.clearTurnTimer(gameId);
    this.clearAutoStartTimer(gameId);

    // Можно добавить дополнительную логику очистки
    console.log(`🧹 Полная очистка игры ${gameId}`);
  }

  // Метод для получения статистики (для мониторинга)
  getStats() {
    return {
      activeTimers: this.turnTimers.size,
      timerGameIds: Array.from(this.turnTimers.keys()),
      activeAutoStartTimers: this.autoStartTimers.size,
      autoStartGameIds: Array.from(this.autoStartTimers.keys())
    };
  }
}
