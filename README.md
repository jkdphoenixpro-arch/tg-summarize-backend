# 🤖 Combined Telegram Bot + 🎴 Game 21

Многофункциональный Telegram бот с AI суммаризацией, опросами и карточной игрой в 21 очко.

> **🎉 Новое:** Игра работает **БЕЗ Docker и БЕЗ Redis**! Используй In-Memory хранилище для разработки.
> 
> ⚠️ **Важно:** Telegram WebApp требует **HTTPS**. Для локального тестирования используй ngrok.
> 
> 📖 **[→ ЧИТАЙ ПЕРВЫМ ←](README-FIRST.md)** | [Решение HTTPS](YOUR-SOLUTION.md) | [Быстрая настройка](QUICK-SETUP.md)

## ✨ Возможности

### 🤖 AI Бот
- 💬 Суммаризация чата через Groq AI
- 📊 Создание мемных опросов
- 🔄 Сбор истории сообщений через userbot
- 📈 Статистика и аналитика

### 🎴 Игра 21 Очко
- 👥 2-6 игроков одновременно
- 🎮 Реалтайм через WebSockets
- 📱 Адаптивный мобильный UI
- 💾 Redis для хранения состояния
- ⚡ Быстрая и отзывчивая игра

## 📋 Команды бота

### В группе:
- `/summarize` - Суммаризировать последние сообщения
- `/opros` - Создать мемный опрос
- `/game21` - Сыграть в 21 Очко (2-6 игроков)

### В личке (только владелец):
- `/status` - Статистика собранных сообщений
- `/analyze` - Анализ сообщений
- `/save` - Сохранить историю через userbot
- `/clear` - Очистить собранные сообщения

## 🚀 Быстрый старт

### Самый простой способ (Windows):

```bash
# 1. Установка
npm install
cd game21 && npm install && cd server && npm install && cd ../client && npm install && cd ../..

# 2. Настройка .env файлов (см. ниже)

# 3. Запуск - просто запусти:
start-all.bat
```

📖 Подробнее: [HOW-TO-RUN.md](HOW-TO-RUN.md)

### Ручной запуск (3 терминала):

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

**Терминал 3 - Bot:**
```bash
npm run combined
```

### Настройка .env файлов:

**Корневой `.env`:**
```env
BOT_TOKEN=твой_токен
GROQ_API_KEY=твой_ключ
GAME_SERVER_URL=http://localhost:3001
WEBAPP_URL=http://localhost:5173
```

**`game21/server/.env`:**
```env
PORT=3001
USE_MEMORY_STORAGE=true
WEBAPP_URL=http://localhost:5173
```

**`game21/client/.env`:**
```env
VITE_SOCKET_URL=http://localhost:3001
```

📖 Подробнее: [START-HERE.md](START-HERE.md) | [HOW-TO-RUN.md](HOW-TO-RUN.md)

## 📁 Структура проекта

```
.
├── combined-bot.js          # Основной бот
├── userbot-collector.js     # Сбор истории
├── game21/                  # Игра 21 Очко
│   ├── server/             # Backend (Node.js + Socket.io)
│   ├── client/             # Frontend (React)
│   ├── README.md           # Документация игры
│   ├── QUICK-START.md      # Быстрый старт
│   ├── EXAMPLES.md         # Примеры
│   └── CHEATSHEET.md       # Шпаргалка
├── README-COMBINED.md       # Документация бота
├── README-GAME21.md         # Краткое описание игры
├── GAME21-SETUP.md          # Настройка игры
└── package.json
```

## 🎮 Использование игры

### В Telegram группе:

1. Добавь бота в группу
2. Напиши `/game21`
3. Нажми кнопку "🎮 Играть"
4. Дождись других игроков (минимум 2)
5. Начни игру и побеждай!

### Локальное тестирование:

```bash
# Запусти игру
npm run game:dev

# Открой в браузере
http://localhost:5173?gameId=test123
```

## 📚 Документация

### Бот
- [README-COMBINED.md](README-COMBINED.md) - Полная документация бота
- [USERBOT-SETUP.md](USERBOT-SETUP.md) - Настройка userbot

### Игра
- [game21/README.md](game21/README.md) - Полная документация игры
- [game21/QUICK-START.md](game21/QUICK-START.md) - Быстрый старт
- [game21/EXAMPLES.md](game21/EXAMPLES.md) - Примеры использования
- [game21/CHEATSHEET.md](game21/CHEATSHEET.md) - Шпаргалка
- [GAME21-SETUP.md](GAME21-SETUP.md) - Детальная настройка
- [README-GAME21.md](README-GAME21.md) - Краткое описание

## 🛠 Технологии

### Бот
- Node.js
- Telegraf (Telegram Bot API)
- Groq AI (суммаризация)
- Telegram Client (userbot)

### Игра
- **Backend:** Node.js, Express, Socket.io, Redis
- **Frontend:** React, Vite, Socket.io Client
- **UI:** CSS3, Telegram WebApp API

## 🌐 Деплой

### Бот
Любой Node.js хостинг:
- Heroku
- Railway
- Render
- VPS

### Игра
- **Backend:** Railway, Render, Heroku
- **Frontend:** Vercel, Netlify, Cloudflare Pages
- **Redis:** Redis Cloud, Upstash

Подробнее: [GAME21-SETUP.md](GAME21-SETUP.md)

## 🐛 Решение проблем

### Бот не отвечает
1. Проверь `BOT_TOKEN` в `.env`
2. Проверь `GROQ_API_KEY`
3. Убедись что бот запущен

### Игра не работает
1. Проверь что Redis запущен: `redis-cli ping`
2. Проверь переменные окружения
3. Запусти проверку: `cd game21 && npm run check`

### Telegram WebApp не открывается
1. Нужен HTTPS (используй ngrok для теста)
2. Проверь `WEBAPP_URL` в `.env`
3. Проверь логи бота

## 📝 Скрипты

```bash
# Бот
npm run combined          # Запустить бота
npm run combined:dev      # С автоперезагрузкой
npm run userbot          # Настройка userbot

# Игра
npm run game:install     # Установить зависимости
npm run game:dev         # Запустить игру (dev)
npm run game:server      # Только backend
npm run game:client      # Только frontend
```

## 🎯 Roadmap

### Бот
- [ ] Больше AI моделей
- [ ] Голосовые сообщения
- [ ] Мультиязычность
- [ ] Веб-панель управления

### Игра
- [ ] Ставки и баланс
- [ ] Статистика игроков
- [ ] Звуковые эффекты
- [ ] Анимации карт
- [ ] Чат в игре
- [ ] Рейтинг игроков
- [ ] Турниры

## 🤝 Вклад

Pull requests приветствуются! Для больших изменений сначала открой issue.

## 📄 Лицензия

MIT

## 👨‍💻 Автор

Создано для combined-bot 🤖

---

**Быстрые ссылки:**
- [Настройка бота](README-COMBINED.md)
- [Настройка игры](GAME21-SETUP.md)
- [Примеры игры](game21/EXAMPLES.md)
- [Шпаргалка](game21/CHEATSHEET.md)
