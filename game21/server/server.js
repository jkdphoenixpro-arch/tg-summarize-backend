import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createClient } from 'redis';
import cors from 'cors';
import dotenv from 'dotenv';
import { GameManager } from './gameManager.js';
import InMemoryStorage from './inMemoryStorage.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.WEBAPP_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// CORS для Express
app.use(cors({
  origin: process.env.WEBAPP_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

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

const gameManager = new GameManager(redis);

console.log('🔧 Setting up Socket.io handlers...');

// Socket.io обработчики
io.on('connection', (socket) => {
  console.log('✅ Игрок подключился:', socket.id);

  socket.on('join_game', async ({ gameId, userId, username, photoUrl }) => {
    console.log('🎮 join_game event:', { gameId, userId, username });
    try {
      const result = await gameManager.joinGame(gameId, userId, username, photoUrl);
      console.log('🎮 join_game result:', result);
      
      if (result.success) {
        socket.join(gameId);
        socket.data.gameId = gameId;
        socket.data.userId = userId;
        
        const gameState = await gameManager.getGameState(gameId);
        console.log('📤 Sending game_update to room:', gameId);
        io.to(gameId).emit('game_update', gameState);
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
        io.to(gameId).emit('game_started', gameState);
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
        io.to(gameId).emit('game_update', gameState);
        
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
        io.to(gameId).emit('game_update', gameState);
        
        if (result.gameOver) {
          io.to(gameId).emit('game_over', gameState);
        }
      }
    } catch (error) {
      console.error('Ошибка stand:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Игрок отключился:', socket.id);
  });
});

// REST API
app.post('/api/create-game', async (req, res) => {
  try {
    const gameId = await gameManager.createGame();
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

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🎮 Game server запущен на порту ${PORT}`);
});
