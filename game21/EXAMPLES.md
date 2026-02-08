# 📚 Примеры использования

## Пример 1: Локальное тестирование

### Шаг 1: Запусти Redis
```bash
docker run -d -p 6379:6379 redis
```

### Шаг 2: Запусти игру
```bash
cd game21
npm run dev
```

### Шаг 3: Открой в браузере
```
http://localhost:5173?gameId=test123
```

### Шаг 4: Открой в другой вкладке
```
http://localhost:5173?gameId=test123
```

Теперь можешь играть сам с собой для теста!

---

## Пример 2: Тестирование с Telegram (ngrok)

### Шаг 1: Установи ngrok
```bash
# Windows (Chocolatey)
choco install ngrok

# macOS
brew install ngrok

# Или скачай с https://ngrok.com/download
```

### Шаг 2: Запусти туннели

**Терминал 1 - Backend:**
```bash
cd game21/server
npm run dev
```

**Терминал 2 - Frontend:**
```bash
cd game21/client
npm run dev
```

**Терминал 3 - ngrok для backend:**
```bash
ngrok http 3001
# Скопируй URL, например: https://abc123.ngrok.io
```

**Терминал 4 - ngrok для frontend:**
```bash
ngrok http 5173
# Скопируй URL, например: https://xyz789.ngrok.io
```

### Шаг 3: Обнови переменные

**game21/server/.env:**
```env
WEBAPP_URL=https://xyz789.ngrok.io
```

**game21/client/.env:**
```env
VITE_SOCKET_URL=https://abc123.ngrok.io
```

**Корневой .env:**
```env
GAME_SERVER_URL=https://abc123.ngrok.io
WEBAPP_URL=https://xyz789.ngrok.io
```

### Шаг 4: Перезапусти всё

### Шаг 5: Запусти бота
```bash
npm run combined
```

### Шаг 6: Тестируй в Telegram
1. Добавь бота в группу
2. `/game21`
3. Нажми кнопку
4. Играй!

---

## Пример 3: Деплой на Vercel + Railway

### Backend на Railway

```bash
cd game21/server

# Установи Railway CLI
npm i -g @railway/cli

# Залогинься
railway login

# Создай проект
railway init

# Добавь Redis через Railway Dashboard:
# New -> Database -> Redis

# Добавь переменные окружения в Railway:
# PORT=3001
# REDIS_URL=<автоматически из Redis>
# WEBAPP_URL=<будет после деплоя frontend>

# Деплой
railway up

# Получи URL
railway domain
# Например: https://game21-server.up.railway.app
```

### Frontend на Vercel

```bash
cd game21/client

# Установи Vercel CLI
npm i -g vercel

# Залогинься
vercel login

# Деплой
vercel

# Добавь переменную окружения в Vercel Dashboard:
# VITE_SOCKET_URL=https://game21-server.up.railway.app

# Продакшн деплой
vercel --prod

# Получи URL
# Например: https://game21.vercel.app
```

### Обнови Railway

Вернись в Railway Dashboard и обнови:
```env
WEBAPP_URL=https://game21.vercel.app
```

### Обнови бота

**Корневой .env:**
```env
GAME_SERVER_URL=https://game21-server.up.railway.app
WEBAPP_URL=https://game21.vercel.app
```

Перезапусти бота:
```bash
npm run combined
```

### Готово! 🎉

Теперь команда `/game21` работает в продакшне!

---

## Пример 4: Кастомизация игры

### Изменить количество игроков

**game21/server/gameManager.js:**
```javascript
// Было:
if (game.players.length >= 6) {

// Стало (например, макс 4):
if (game.players.length >= 4) {
```

### Изменить цвета

**game21/client/src/index.css:**
```css
:root {
  --primary-color: #ff6b6b;
  --secondary-color: #4ecdc4;
  --background: #1a1a2e;
}
```

### Добавить звуки

**game21/client/src/components/Game.jsx:**
```javascript
const cardSound = new Audio('/sounds/card.mp3');

const handleHit = () => {
  cardSound.play();
  hapticFeedback('light');
  socket.emit('hit', { gameId, userId: user.userId });
};
```

### Изменить время игры

**game21/server/gameManager.js:**
```javascript
// Добавить таймер на ход
async saveGameState(game) {
  await this.redis.set(
    `game:${game.id}`, 
    JSON.stringify(game), 
    { EX: 7200 } // 2 часа вместо 1
  );
}
```

---

## Пример 5: Мониторинг игр

### Просмотр активных игр в Redis

```bash
redis-cli

# Посмотреть все игры
KEYS game:*

# Посмотреть конкретную игру
GET game:game_1234567890_abc123

# Удалить игру
DEL game:game_1234567890_abc123

# Посмотреть TTL (время жизни)
TTL game:game_1234567890_abc123
```

### Логирование на сервере

**game21/server/server.js:**
```javascript
// Добавь middleware для логирования
io.use((socket, next) => {
  console.log(`[${new Date().toISOString()}] Подключение: ${socket.id}`);
  next();
});

// Логируй все события
socket.onAny((event, ...args) => {
  console.log(`[${socket.id}] ${event}:`, args);
});
```

---

## Пример 6: Добавление ставок

### Backend

**game21/server/gameManager.js:**
```javascript
async joinGame(gameId, userId, username, photoUrl, bet = 10) {
  // ...
  game.players.push({
    userId,
    username,
    photoUrl,
    cards: [],
    score: 0,
    status: 'active',
    bet: bet, // Ставка игрока
    balance: 1000 // Начальный баланс
  });
  // ...
}

determineWinners(game) {
  const dealerScore = game.dealer.score;
  const dealerBusted = dealerScore > 21;
  
  for (const player of game.players) {
    if (player.status === 'busted') {
      player.result = 'lose';
      player.balance -= player.bet; // Вычитаем ставку
    } else if (dealerBusted || player.score > dealerScore) {
      player.result = 'win';
      player.balance += player.bet; // Добавляем выигрыш
    } else if (player.score === dealerScore) {
      player.result = 'push';
      // Баланс не меняется
    } else {
      player.result = 'lose';
      player.balance -= player.bet;
    }
  }
}
```

### Frontend

**game21/client/src/components/Game.jsx:**
```javascript
{myPlayer && (
  <div className="player-info">
    <span>Баланс: {myPlayer.balance}</span>
    <span>Ставка: {myPlayer.bet}</span>
  </div>
)}
```

---

## Пример 7: Добавление чата

### Backend

**game21/server/server.js:**
```javascript
socket.on('send_message', async ({ gameId, userId, message }) => {
  io.to(gameId).emit('new_message', {
    userId,
    username: socket.data.username,
    message,
    timestamp: Date.now()
  });
});
```

### Frontend

**game21/client/src/components/Chat.jsx:**
```javascript
function Chat({ socket, gameId, user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    socket.on('new_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });
  }, [socket]);

  const sendMessage = () => {
    if (input.trim()) {
      socket.emit('send_message', {
        gameId,
        userId: user.userId,
        message: input
      });
      setInput('');
    }
  };

  return (
    <div className="chat">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i}>
            <strong>{msg.username}:</strong> {msg.message}
          </div>
        ))}
      </div>
      <input 
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
      />
    </div>
  );
}
```

---

## Полезные команды

```bash
# Проверка настройки
cd game21
npm run check

# Установка всех зависимостей
npm run install:all

# Запуск для разработки
npm run dev

# Только сервер
npm run dev:server

# Только клиент
npm run dev:client

# Сборка для продакшна
npm run build

# Запуск продакшн сервера
npm start
```

---

Больше примеров в [README.md](README.md) и [GAME21-SETUP.md](../GAME21-SETUP.md)!
