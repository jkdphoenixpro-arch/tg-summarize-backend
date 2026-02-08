# 🎴 Игра 21 Очко для Telegram

## Описание

Многопользовательская карточная игра в 21 очко (Blackjack), интегрированная в Telegram бот через WebApp.

## ✨ Особенности

- 👥 **2-6 игроков** одновременно
- 🎮 **Реалтайм** через WebSockets (Socket.io)
- 📱 **Мобильный UI** адаптированный под Telegram
- 🎴 **Красивые карты** с CSS анимациями
- 💾 **Redis** для хранения состояния игр
- ⚡ **Быстрая игра** без задержек

## 🎯 Как играть

1. Добавь бота в группу
2. Напиши команду `/game21`
3. Нажми кнопку "🎮 Играть"
4. Дождись других игроков (минимум 2)
5. Начни игру и побеждай!

## 📦 Установка и запуск

### Быстрый старт

```bash
# 1. Установи зависимости
cd game21
npm run install:all

# 2. Запусти Redis
docker run -d -p 6379:6379 redis

# 3. Настрой переменные окружения
# Создай game21/server/.env и game21/client/.env
# (см. .env.example файлы)

# 4. Запусти игру
npm run dev

# 5. В корне проекта запусти бота
cd ..
npm run combined
```

Подробная инструкция: [game21/README.md](game21/README.md)

## 🛠 Технологии

### Backend
- Node.js + Express
- Socket.io (WebSockets)
- Redis

### Frontend
- React + Vite
- Socket.io Client
- Telegram WebApp API
- CSS3 (адаптивный дизайн)

## 📁 Структура

```
game21/
├── server/          # Backend (Node.js + Socket.io + Redis)
│   ├── server.js
│   └── gameManager.js
├── client/          # Frontend (React)
│   └── src/
│       ├── App.jsx
│       └── components/
└── README.md
```

## 🎲 Правила игры

**Цель:** Набрать 21 очко или максимально близко

**Карты:**
- 2-10: номинал
- J, Q, K: 10 очков
- A: 11 или 1 (автоматически)

**Ход игры:**
1. Каждый получает 2 карты
2. Дилер получает 2 карты (одна скрыта)
3. Игроки ходят по очереди
4. Можно взять карту (Hit) или пасовать (Stand)
5. Перебор (>21) = проигрыш

**Победа:**
- Больше очков чем у дилера (но ≤21)
- Дилер перебрал, а ты нет
- Ничья при равном счете

## 🌐 Деплой

Для продакшна нужен HTTPS:

**Backend:** Railway, Render, Heroku
**Frontend:** Vercel, Netlify, Cloudflare Pages
**Redis:** Redis Cloud, Upstash

Пример:
```bash
# Frontend на Vercel
cd game21/client
vercel --prod

# Backend на Railway
cd game21/server
railway up
```

## 🔧 Конфигурация бота

В корневом `.env` добавь:

```env
GAME_SERVER_URL=http://localhost:3001
WEBAPP_URL=http://localhost:5173
```

Команда `/game21` уже добавлена в `combined-bot.js`.

## 📝 API

### REST
- `POST /api/create-game` - Создать игру
- `GET /api/game/:gameId` - Получить состояние

### Socket.io Events
- `join_game` - Присоединиться
- `start_game` - Начать
- `hit` - Взять карту
- `stand` - Пасовать

## 🐛 Отладка

**Проверка Redis:**
```bash
redis-cli ping
# PONG
```

**Тест без Telegram:**
Открой http://localhost:5173 в браузере

**Логи:**
Сервер выводит все события в консоль

## 📄 Лицензия

MIT

---

**Создано для combined-bot** 🤖
