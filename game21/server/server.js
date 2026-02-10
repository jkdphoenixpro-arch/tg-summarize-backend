import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createClient } from 'redis';
import cors from 'cors';
import dotenv from 'dotenv';
import { GameManager } from './gameManager.js';
import InMemoryStorage from './inMemoryStorage.js';
import { connectDatabase } from './database.js';
import Player from './models/Player.js';
import { botEvents } from '../../botEvents.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Разрешенные origins для CORS
const allowedOrigins = [
  process.env.WEBAPP_URL,
  'http://localhost:5173',
  'https://tg-summarize-bot.pages.dev',
  /\.pages\.dev$/  // Все поддомены pages.dev
].filter(Boolean);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// CORS для Express
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Подключаемся к MongoDB
await connectDatabase();

// Redis клиент или In-Memory хранилище
let redis;

if (process.env.USE_MEMORY_STORAGE === 'true') {
  // Используем In-Memory хранилище (для разработки без Redis)
  console.log('🔶 Режим: In-Memory хранилище');
  redis = new InMemoryStorage();
  await redis.connect();
} else {
  // Используем Redis
  console.log('🔴 Режим: Redis');
  redis = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });

  redis.on('error', (err) => {
    console.error('❌ Redis Error:', err);
    console.log('💡 Совет: Установи Redis или используй USE_MEMORY_STORAGE=true в .env');
  });

  try {
    await redis.connect();
    console.log('✅ Redis подключен');
  } catch (error) {
    console.error('❌ Не удалось подключиться к Redis');
    console.log('💡 Используй USE_MEMORY_STORAGE=true в .env для работы без Redis');
    process.exit(1);
  }
}

const gameManager = new GameManager(redis, io, startGameInterval, botEvents);

// Хранилище интервалов для каждой игры (для очистки)
const gameIntervals = new Map();

// Функция для очистки интервала игры
function clearGameInterval(gameId) {
  const intervalId = gameIntervals.get(gameId);
  if (intervalId) {
    clearInterval(intervalId);
    gameIntervals.delete(gameId);
    console.log(`🧹 Интервал очищен для игры ${gameId}`);
  }
}

// Функция для запуска интервала обновления игры
function startGameInterval(gameId) {
  // Очищаем старый интервал если есть
  clearGameInterval(gameId);
  
  // Устанавливаем интервал для отправки обновлений времени
  const intervalId = setInterval(async () => {
    const currentGame = await gameManager.getGameState(gameId);
    if (!currentGame || currentGame.status !== 'playing') {
      clearGameInterval(gameId);
      return;
    }
    emitGameUpdate(gameId, currentGame);
  }, 1000); // Обновляем каждую секунду
  
  // Сохраняем intervalId в Map для очистки
  gameIntervals.set(gameId, intervalId);
  console.log(`⏱️ Интервал обновления запущен для игры ${gameId}`);
}

// Функция для отправки обновлений игры с информацией о времени
function emitGameUpdate(gameId, gameState) {
  const remainingTime = gameManager.getRemainingTime(gameState);
  const autoStartRemaining = gameManager.getAutoStartRemainingTime(gameState);
  
  // Логируем для отладки
  if (gameState.status === 'playing') {
    console.log(`📤 emitGameUpdate: gameId=${gameId}, remainingTime=${remainingTime}, status=${gameState.status}`);
  }
  
  io.to(gameId).emit('game_update', {
    ...gameState,
    remainingTime,
    autoStartRemaining
  });
}

console.log('🔧 Setting up Socket.io handlers...');

// Socket.io обработчики
io.on('connection', (socket) => {
  console.log('✅ Игрок подключился:', socket.id);

  socket.on('join_game', async ({ gameId, userId, username, photoUrl, bet }) => {
    console.log('🎮 join_game event:', { gameId, userId, username, bet });
    try {
      const result = await gameManager.joinGame(gameId, userId, username, photoUrl, bet);
      console.log('🎮 join_game result:', result);
      
      if (result.success) {
        socket.join(gameId);
        socket.data.gameId = gameId;
        socket.data.userId = userId;
        
        const gameState = await gameManager.getGameState(gameId);
        console.log('📤 Sending game_update to room:', gameId);
        
        // Отправляем обновление с таймерами
        emitGameUpdate(gameId, gameState);
        
        // Если это второй игрок и игра в ожидании, запускаем интервал для автостарта
        if (gameState.players.length >= 2 && gameState.status === 'waiting' && !gameIntervals.has(gameId)) {
          const intervalId = setInterval(async () => {
            const currentGame = await gameManager.getGameState(gameId);
            if (!currentGame || currentGame.status !== 'waiting') {
              clearGameInterval(gameId);
              return;
            }
            emitGameUpdate(gameId, currentGame);
          }, 1000); // Обновляем каждую секунду
          
          gameIntervals.set(gameId, intervalId);
          console.log(`⏱️ Интервал автостарта запущен для игры ${gameId}`);
        }
      } else {
        console.log('❌ join_game failed:', result.error);
        socket.emit('error', { message: result.error });
      }
    } catch (error) {
      console.error('❌ Ошибка join_game:', error);
      socket.emit('error', { message: 'Ошибка подключения к игре' });
    }
  });

  socket.on('start_game', async ({ gameId, userId }) => {
    try {
      const result = await gameManager.startGame(gameId, userId);
      
      if (result.success) {
        const gameState = await gameManager.getGameState(gameId);
        
        // Отправляем game_started с таймерами
        const remainingTime = gameManager.getRemainingTime(gameState);
        const autoStartRemaining = gameManager.getAutoStartRemainingTime(gameState);
        io.to(gameId).emit('game_started', {
          ...gameState,
          remainingTime,
          autoStartRemaining
        });
        
        // Запускаем интервал обновления
        startGameInterval(gameId);
      } else {
        socket.emit('error', { message: result.error });
      }
    } catch (error) {
      console.error('Ошибка start_game:', error);
    }
  });

  socket.on('hit', async ({ gameId, userId }) => {
    try {
      const result = await gameManager.hit(gameId, userId);
      
      if (result.success) {
        const gameState = await gameManager.getGameState(gameId);
        emitGameUpdate(gameId, gameState);
        
        if (result.busted) {
          io.to(gameId).emit('player_busted', { userId });
        }
      }
    } catch (error) {
      console.error('Ошибка hit:', error);
    }
  });

  socket.on('stand', async ({ gameId, userId }) => {
    try {
      const result = await gameManager.stand(gameId, userId);
      
      if (result.success) {
        const gameState = await gameManager.getGameState(gameId);
        emitGameUpdate(gameId, gameState);
        
        if (result.gameOver) {
          io.to(gameId).emit('game_over', gameState);
          // Очищаем интервал после завершения игры
          clearGameInterval(gameId);
        }
      }
    } catch (error) {
      console.error('Ошибка stand:', error);
    }
  });

  socket.on('extend_auto_start', async ({ gameId, userId }) => {
    try {
      const result = await gameManager.extendAutoStart(gameId, userId);
      
      if (result.success) {
        const gameState = await gameManager.getGameState(gameId);
        const autoStartRemaining = gameManager.getAutoStartRemainingTime(gameState);
        io.to(gameId).emit('auto_start_extended', { 
          newTime: result.newTime,
          remainingTime: autoStartRemaining
        });
        io.to(gameId).emit('game_update', {
          ...gameState,
          autoStartRemaining
        });
      } else {
        socket.emit('error', { message: result.error });
      }
    } catch (error) {
      console.error('Ошибка extend_auto_start:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Игрок отключился:', socket.id);
  });
});

// REST API
app.post('/api/create-game', async (req, res) => {
  try {
    const { gameType, chatId } = req.body; // 'blackjack' или 'pvp' + chatId
    const gameId = await gameManager.createGame(gameType, chatId);
    res.json({ success: true, gameId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/game/:gameId', async (req, res) => {
  try {
    const gameState = await gameManager.getGameState(req.params.gameId);
    res.json({ success: true, game: gameState });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Получить баланс и статистику игрока
app.get('/api/player/:userId', async (req, res) => {
  try {
    const player = await Player.findOne({ userId: req.params.userId });
    
    if (!player) {
      return res.json({ 
        success: true, 
        player: {
          balance: 1000,
          stats: {
            gamesPlayed: 0,
            gamesWon: 0,
            gamesLost: 0,
            gamesPush: 0
          }
        }
      });
    }
    
    res.json({ success: true, player });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Мониторинг состояния сервера (для отладки)
app.get('/api/stats', async (req, res) => {
  try {
    const stats = gameManager.getStats();
    const intervalStats = {
      activeIntervals: gameIntervals.size,
      intervalGameIds: Array.from(gameIntervals.keys())
    };
    
    res.json({ 
      success: true, 
      gameManager: stats,
      intervals: intervalStats
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Периодическая очистка завершенных игр (каждые 5 минут)
setInterval(async () => {
  try {
    console.log('🧹 Запуск периодической очистки...');
    
    // Получаем все ключи игр
    const gameKeys = await redis.keys('game:*');
    let cleanedCount = 0;
    
    for (const key of gameKeys) {
      const gameData = await redis.get(key);
      if (gameData) {
        const game = JSON.parse(gameData);
        
        // Очищаем завершенные игры старше 10 минут
        if (game.status === 'finished') {
          const gameAge = Date.now() - game.createdAt;
          const TEN_MINUTES = 10 * 60 * 1000;
          
          if (gameAge > TEN_MINUTES) {
            await redis.del(key);
            clearGameInterval(game.id);
            gameManager.clearTurnTimer(game.id);
            cleanedCount++;
            console.log(`🗑️ Удалена завершенная игра ${game.id} (возраст: ${Math.round(gameAge / 60000)} мин)`);
          }
        }
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`✅ Очищено игр: ${cleanedCount}`);
    }
  } catch (error) {
    console.error('❌ Ошибка периодической очистки:', error);
  }
}, 5 * 60 * 1000); // Каждые 5 минут

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🎮 Game server запущен на порту ${PORT}`);
  console.log(`📊 Статистика доступна на /api/stats`);
});
