# 🎴 Шпаргалка по игре 21 Очко

## 🚀 Быстрый старт (3 команды)

```bash
npm run install:all    # Установка
docker run -d -p 6379:6379 redis  # Redis
npm run dev           # Запуск
```

Открой: http://localhost:5173?gameId=test

---

## 📁 Структура файлов

```
game21/
├── server/
│   ├── server.js         # Express + Socket.io
│   ├── gameManager.js    # Логика игры
│   └── .env             # PORT, REDIS_URL
├── client/
│   ├── src/
│   │   ├── App.jsx      # Главный компонент
│   │   ├── components/
│   │   │   ├── Game.jsx    # Игровой экран
│   │   │   ├── Lobby.jsx   # Лобби
│   │   │   └── Card.jsx    # Карта
│   │   └── utils/
│   │       └── telegram.js # Telegram API
│   └── .env             # VITE_SOCKET_URL
└── package.json
```

---

## ⚙️ Переменные окружения

### server/.env
```env
PORT=3001
REDIS_URL=redis://localhost:6379
WEBAPP_URL=http://localhost:5173
```

### client/.env
```env
VITE_SOCKET_URL=http://localhost:3001
```

### Корневой .env
```env
GAME_SERVER_URL=http://localhost:3001
WEBAPP_URL=http://localhost:5173
```

---

## 🎮 Команды бота

```bash
/game21  # Создать игру в группе
```

---

## 🔌 Socket.io Events

### Client → Server
```javascript
socket.emit('join_game', { gameId, userId, username, photoUrl })
socket.emit('start_game', { gameId, userId })
socket.emit('hit', { gameId, userId })
socket.emit('stand', { gameId, userId })
```

### Server → Client
```javascript
socket.on('game_update', (state) => {})
socket.on('game_started', (state) => {})
socket.on('game_over', (state) => {})
socket.on('error', (error) => {})
```

---

## 🎲 Состояние игры

```javascript
{
  id: 'game_123',
  status: 'waiting' | 'playing' | 'finished',
  players: [
    {
      userId: '123',
      username: 'Player1',
      cards: [{ suit: 'hearts', rank: 'A' }],
      score: 11,
      status: 'active' | 'stand' | 'busted',
      result: 'win' | 'lose' | 'push'
    }
  ],
  dealer: {
    cards: [...],
    score: 17
  },
  currentPlayerIndex: 0
}
```

---

## 🛠 Полезные команды

```bash
# Проверка
npm run check

# Разработка
npm run dev              # Всё вместе
npm run dev:server       # Только backend
npm run dev:client       # Только frontend

# Продакшн
npm run build           # Сборка
npm start              # Запуск

# Redis
redis-cli ping         # Проверка
redis-cli KEYS game:*  # Все игры
redis-cli FLUSHALL     # Очистить всё
```

---

## 🐛 Отладка

### Redis не работает
```bash
docker ps                    # Проверь контейнер
docker restart redis         # Перезапусти
redis-cli ping              # Проверь подключение
```

### Frontend не подключается
1. Проверь `VITE_SOCKET_URL` в `client/.env`
2. Проверь CORS в `server/server.js`
3. Перезапусти оба сервера

### Telegram WebApp не открывается
1. Нужен HTTPS (используй ngrok)
2. Проверь `WEBAPP_URL` в корневом `.env`
3. Проверь логи бота

---

## 📱 Тестирование

### Без Telegram
```
http://localhost:5173?gameId=test123
```

### С Telegram (локально)
```bash
ngrok http 5173          # Frontend
ngrok http 3001          # Backend
# Обнови .env с ngrok URLs
```

### В группе
```
1. Добавь бота в группу
2. /game21
3. Нажми кнопку
```

---

## 🌐 Деплой

### Vercel (Frontend)
```bash
cd client
vercel --prod
```

### Railway (Backend)
```bash
cd server
railway up
```

### Upstash (Redis)
```
1. https://upstash.com
2. Создай Redis
3. Скопируй URL
```

---

## 🎨 Кастомизация

### Цвета
`client/src/index.css` - CSS переменные

### Правила
`server/gameManager.js` - Логика игры

### UI
`client/src/components/` - React компоненты

---

## 📚 Документация

- [README.md](README.md) - Полная документация
- [QUICK-START.md](QUICK-START.md) - Быстрый старт
- [EXAMPLES.md](EXAMPLES.md) - Примеры
- [../GAME21-SETUP.md](../GAME21-SETUP.md) - Настройка

---

## 💡 Советы

✅ Используй `npm run check` перед запуском
✅ Для продакшна нужен HTTPS
✅ Redis обязателен для работы
✅ Логи помогут найти проблемы
✅ Тестируй локально перед деплоем

---

**Создано для combined-bot** 🤖
