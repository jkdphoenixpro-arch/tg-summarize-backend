# ⚡ Быстрая настройка (5 минут)

## Шаг 1: Установка (2 минуты)

### Автоматически (Windows):
```bash
setup.bat
```

### Вручную:
```bash
npm install
cd game21 && npm install && cd server && npm install && cd ../client && npm install && cd ../..
```

---

## Шаг 2: Настройка (2 минуты)

### Создай 3 файла .env:

#### 1. Корневой `.env` (для бота)

```env
# Telegram Bot (обязательно)
BOT_TOKEN=твой_токен_от_BotFather
GROQ_API_KEY=твой_ключ_от_groq

# Игра (обязательно)
GAME_SERVER_URL=http://localhost:3001
WEBAPP_URL=http://localhost:5173

# Опционально
TARGET_CHAT_ID=-1002438653104
MESSAGE_LIMIT=150
```

#### 2. `game21/server/.env`

```env
PORT=3001
USE_MEMORY_STORAGE=true
WEBAPP_URL=http://localhost:5173
```

#### 3. `game21/client/.env`

```env
VITE_SOCKET_URL=http://localhost:3001
```

---

## Шаг 3: Запуск (1 минута)

### Автоматически (Windows):
```bash
start-all.bat
```

Откроется 3 окна:
- Backend (порт 3001)
- Frontend (порт 5173)
- Telegram Bot

### Вручную (3 терминала):

**Терминал 1:**
```bash
cd game21/server
npm run dev
```

**Терминал 2:**
```bash
cd game21/client
npm run dev
```

**Терминал 3:**
```bash
npm run combined
```

---

## ✅ Проверка

### 1. Проверь игру в браузере:
```
http://localhost:5173?gameId=test123
```

Должна загрузиться игра.

### 2. Проверь бота в Telegram:

⚠️ **Важно:** Telegram WebApp требует HTTPS!

Для локального тестирования используй **ngrok**:

📖 [FIX-HTTPS-ISSUE.md](../FIX-HTTPS-ISSUE.md) - Как настроить HTTPS

В группе напиши:
```
/game21
```

Должна появиться кнопка "🎮 Играть".

---

## 🐛 Проблемы?

### Ошибка при установке

```bash
# Очисти кеш npm
npm cache clean --force

# Попробуй снова
setup.bat
```

### "Port already in use"

```bash
# Убей процессы на портах
netstat -ano | findstr :3001
taskkill /PID <PID> /F

netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Бот не создает игру

1. Проверь что все 3 терминала запущены
2. Проверь `.env` файлы
3. Проверь логи в терминалах

---

## 📁 Структура .env файлов

```
Проект/
├── .env                      ← BOT_TOKEN, GROQ_API_KEY, GAME_SERVER_URL
├── combined-bot.js
│
└── game21/
    ├── server/
    │   └── .env             ← USE_MEMORY_STORAGE=true
    │
    └── client/
        └── .env             ← VITE_SOCKET_URL
```

---

## 🎯 Что дальше?

1. ✅ Протестируй игру локально
2. ✅ Добавь бота в группу
3. ✅ Используй `/game21`
4. ✅ Играй с друзьями!

---

## 📚 Документация

- [HOW-TO-RUN.md](HOW-TO-RUN.md) - Подробная инструкция
- [START-HERE.md](START-HERE.md) - Быстрый старт
- [REDIS-ALTERNATIVES.md](REDIS-ALTERNATIVES.md) - Про Redis
- [game21/FAQ.md](game21/FAQ.md) - Частые вопросы

---

**Готово!** Теперь всё работает! 🎉
