# 🎴 21 Очко (Blackjack) для Telegram

Многопользовательская игра в 21 очко с WebApp интерфейсом для Telegram.

## 🎯 Возможности

- 👥 От 2 до 6 игроков одновременно
- 🎮 Реалтайм игра через WebSockets (Socket.io)
- 💰 Система ставок (20-300₽) и баланса игроков
- 📊 Сохранение статистики в MongoDB
- 📱 Адаптивный UI для мобильных устройств
- 🎴 Красивая визуализация карт
- 💾 Хранение состояния игры в Redis/Memory
- ⚡ Быстрая и отзывчивая игра

## 🛠 Технологии

### Backend
- Node.js + Express
- Socket.io (WebSockets)
- Redis или In-Memory (хранение состояния)
- MongoDB (баланс и статистика игроков)

### Frontend
- React + Vite
- Socket.io Client
- CSS3 (адаптивный дизайн)
- Telegram WebApp API

## 📦 Установка

### 1. Установка зависимостей

```bash
# Из корня проекта game21
npm run install:all
```

### 2. Настройка Redis

Установи и запусти Redis:

**Windows:**
```bash
# Через WSL или Docker
docker run -d -p 6379:6379 redis
```

**Linux/Mac:**
```bash
sudo apt install redis-server  # Ubuntu/Debian
brew install redis             # macOS
redis-server
```

### 3. Настройка переменных окружения

Создай файл `server/.env`:

```env
PORT=3001
REDIS_URL=redis://localhost:6379
TELEGRAM_BOT_TOKEN=your_bot_token
WEBAPP_URL=https://your-domain.com
```

## 🚀 Запуск

### Разработка (локально)

```bash
# Запустить сервер и клиент одновременно
npm run dev

# Или по отдельности:
npm run dev:server  # Backend на порту 3001
npm run dev:client  # Frontend на порту 5173
```

### Продакшн

```bash
# Собрать клиент
npm run build

# Запустить сервер
npm start
```

## 🎮 Использование в Telegram боте

### 1. Добавь команду в бота

Команда `/game21` уже добавлена в `combined-bot.js`.

### 2. Настрой переменные в корневом .env

```env
GAME_SERVER_URL=http://localhost:3001
WEBAPP_URL=http://localhost:5173
```

### 3. Запусти бота

```bash
npm run combined
```

### 4. Используй в группе

```
/game21
```

Бот отправит сообщение с кнопкой "🎮 Играть", которая откроет WebApp с игрой.

## 🎲 Правила игры

1. **Цель**: Набрать 21 очко или максимально близко к этому числу
2. **Карты**:
   - Числовые карты (2-10): номинал
   - Валеты, Дамы, Короли: 10 очков
   - Тузы: 11 или 1 очко (автоматически)
3. **Ход игры**:
   - Каждый игрок получает 2 карты
   - Дилер получает 2 карты (одна скрыта)
   - Игроки ходят по очереди
   - Можно взять карту (Hit) или пасовать (Stand)
   - Если перебор (>21) - проигрыш
4. **Победа**:
   - Больше очков чем у дилера (но не >21)
   - Дилер перебрал, а ты нет
   - Ничья при равном счете

## 📁 Структура проекта

```
game21/
├── server/              # Backend
│   ├── server.js       # Express + Socket.io сервер
│   ├── gameManager.js  # Логика игры
│   ├── models/
│   │   └── Player.js   # MongoDB модель игрока
│   └── package.json
├── client/              # Frontend
│   ├── src/
│   │   ├── App.jsx     # Главный компонент
│   │   ├── components/
│   │   │   ├── Game.jsx    # Игровой экран
│   │   │   ├── Lobby.jsx   # Лобби с выбором ставки
│   │   │   └── Card.jsx    # Карта
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
├── BALANCE-AND-BETS.md  # Документация по ставкам
└── README.md
```

## 🔧 API

### REST API

**POST /api/create-game**
Создает новую игру

Response:
```json
{
  "success": true,
  "gameId": "game_1234567890_abc123"
}
```

**GET /api/game/:gameId**
Получить состояние игры

### Socket.io Events

**Client → Server:**
- `join_game` - Присоединиться к игре
- `start_game` - Начать игру
- `hit` - Взять карту
- `stand` - Пасовать

**Server → Client:**
- `game_update` - Обновление состояния
- `game_started` - Игра началась
- `game_over` - Игра завершена
- `player_busted` - Игрок перебрал
- `error` - Ошибка

## 🌐 Деплой

### Для продакшна нужно:

1. **Хостинг для сервера** (Node.js):
   - Heroku, Railway, Render, VPS

2. **Redis сервер**:
   - Redis Cloud, Upstash, или свой

3. **Хостинг для клиента** (статика):
   - Vercel, Netlify, Cloudflare Pages

4. **HTTPS обязателен** для Telegram WebApp

### Пример деплоя на Vercel + Railway

**Backend (Railway):**
```bash
cd server
railway up
```

**Frontend (Vercel):**
```bash
cd client
vercel --prod
```

Обнови переменные окружения с продакшн URL.

## 🐛 Отладка

### Проверка подключения к Redis
```bash
redis-cli ping
# Должно вернуть: PONG
```

### Логи сервера
Сервер выводит подробные логи всех событий:
- Подключения игроков
- Создание игр
- Действия в игре

### Тестирование без Telegram
Открой `http://localhost:5173` в браузере - игра будет работать с тестовым пользователем.

## 📝 TODO

- [x] Добавить ставки
- [x] Система баланса игроков
- [x] Интеграция с MongoDB
- [ ] Звуковые эффекты
- [ ] Анимации карт
- [ ] Чат в игре
- [ ] Рейтинг игроков
- [ ] История игр

## 📄 Лицензия

MIT
