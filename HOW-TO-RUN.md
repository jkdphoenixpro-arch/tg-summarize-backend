# 🚀 Как запустить проект

## Простая инструкция для combined-bot + игра

### Шаг 1: Установка зависимостей

```bash
# Из корня проекта (где combined-bot.js)

# 1. Установи зависимости для бота
npm install

# 2. Установи зависимости для игры
cd game21
npm install
cd server
npm install
cd ../client
npm install
cd ../..
```

### Шаг 2: Настройка

#### 2.1 Настрой бота (корневой .env)

Файл `.env` в корне проекта:

```env
# Telegram Bot
BOT_TOKEN=твой_токен_бота
GROQ_API_KEY=твой_groq_ключ

# Целевой чат (опционально)
TARGET_CHAT_ID=-1002438653104
MESSAGE_LIMIT=150

# Игра 21 Очко
GAME_SERVER_URL=http://localhost:3001
WEBAPP_URL=http://localhost:5173
```

#### 2.2 Настрой игру

**Файл `game21/server/.env`:**

```env
PORT=3001
USE_MEMORY_STORAGE=true
WEBAPP_URL=http://localhost:5173
```

**Файл `game21/client/.env`:**

```env
VITE_SOCKET_URL=http://localhost:3001
```

### Шаг 3: Запуск

Тебе нужно **3 терминала**:

#### Терминал 1 - Backend игры

```bash
cd game21/server
npm run dev
```

Должно появиться:
```
🔶 Режим: In-Memory хранилище
✅ In-Memory хранилище готово
🎮 Game server запущен на порту 3001
```

#### Терминал 2 - Frontend игры

```bash
cd game21/client
npm run dev
```

Должно появиться:
```
VITE ready in XXX ms
➜  Local:   http://localhost:5173/
```

#### Терминал 3 - Telegram бот

```bash
# Из корня проекта
npm run combined
```

Должно появиться:
```
🤖 Объединенный бот запущен!
```

### Шаг 4: Проверка

#### Проверь игру в браузере:

```
http://localhost:5173?gameId=test123
```

Должна загрузиться игра.

#### Проверь бота в Telegram:

1. Добавь бота в группу
2. Напиши `/game21`
3. Должна появиться кнопка "🎮 Играть"
4. Нажми - откроется игра

---

## 🎯 Быстрый запуск (копипаста)

### Первый раз (установка):

```bash
# Установка
npm install
cd game21 && npm install && cd server && npm install && cd ../client && npm install && cd ../..

# Настройка
# Создай .env файлы (см. выше)
```

### Каждый раз (запуск):

**Терминал 1:**
```bash
cd game21/server && npm run dev
```

**Терминал 2:**
```bash
cd game21/client && npm run dev
```

**Терминал 3:**
```bash
npm run combined
```

---

## 🐛 Проблемы

### "Cannot connect to Redis"

В `game21/server/.env` должно быть:
```env
USE_MEMORY_STORAGE=true
```

### "Port 3001 already in use"

Убей процесс:
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### "Port 5173 already in use"

Убей процесс:
```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Бот не создает игру

1. Проверь что игра запущена (терминалы 1 и 2)
2. Проверь `GAME_SERVER_URL` в корневом `.env`
3. Проверь логи бота

---

## 📝 Структура запуска

```
Корень проекта/
├── combined-bot.js          ← Терминал 3
├── .env                     ← Настройки бота
│
└── game21/
    ├── server/
    │   ├── server.js        ← Терминал 1
    │   └── .env             ← USE_MEMORY_STORAGE=true
    │
    └── client/
        ├── src/
        └── .env             ← VITE_SOCKET_URL
```

---

## ✅ Чеклист

- [ ] Установлены зависимости (npm install везде)
- [ ] Созданы .env файлы (3 штуки)
- [ ] USE_MEMORY_STORAGE=true в game21/server/.env
- [ ] Запущен backend (терминал 1)
- [ ] Запущен frontend (терминал 2)
- [ ] Запущен бот (терминал 3)
- [ ] Игра открывается в браузере
- [ ] Бот отвечает в Telegram
- [ ] Команда /game21 работает

---

## 💡 Совет

Создай 3 ярлыка для быстрого запуска:

**start-backend.bat:**
```batch
cd game21\server
npm run dev
pause
```

**start-frontend.bat:**
```batch
cd game21\client
npm run dev
pause
```

**start-bot.bat:**
```batch
npm run combined
pause
```

Тогда просто запускай 3 файла!

---

**Готово!** Теперь всё работает вместе! 🎉
