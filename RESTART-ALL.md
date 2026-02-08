# 🔄 Перезапуск всех сервисов

## Проблема: Бесконечная загрузка

Frontend не может подключиться к backend через Socket.io.

**Причина:** Backend и Frontend не перезапущены после изменения `.env` файлов.

---

## ✅ Решение: Перезапусти ВСЁ

### Шаг 1: Останови всё

В каждом терминале нажми:
```
Ctrl + C
```

Останови:
- ✅ Backend (терминал 1)
- ✅ Frontend (терминал 2)
- ✅ Bot (терминал 3)

### Шаг 2: Запусти заново

**Терминал 1 - Backend:**
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

**Терминал 2 - Frontend:**
```bash
cd game21/client
npm run dev
```

Должно появиться:
```
VITE ready in XXX ms
➜  Local:   http://localhost:5173/
```

**Терминал 3 - Bot:**
```bash
npm run combined
```

Должно появиться:
```
🤖 Объединенный бот запущен!
```

### Шаг 3: Проверь

**В Telegram:**
```
/game21
```

Нажми кнопку "🎮 Играть" - игра должна загрузиться!

---

## 🔍 Проверка подключения

### Открой консоль браузера (F12)

Должны быть сообщения:
```
Socket.io connected
Game state loaded
```

Не должно быть:
```
❌ Connection failed
❌ ERR_CONNECTION_REFUSED
```

### Проверь что backend работает

В терминале backend должны быть сообщения:
```
Игрок подключился: <socket_id>
```

---

## 🐛 Если всё ещё не работает

### 1. Проверь .env файлы

**`game21/client/.env`:**
```env
VITE_SOCKET_URL=https://tumid-hans-nonspiritually.ngrok-free.dev
```

**`game21/server/.env`:**
```env
PORT=3001
USE_MEMORY_STORAGE=true
WEBAPP_URL=https://b7463e09913142b1b6497672490d9c38.loophole.site
```

### 2. Проверь что ngrok работает

В терминале ngrok должно быть:
```
Forwarding  https://xxx.ngrok-free.app -> http://localhost:3001
```

### 3. Проверь CORS

В `game21/server/server.js` должно быть:
```javascript
cors: {
  origin: process.env.WEBAPP_URL || 'http://localhost:5173',
  methods: ['GET', 'POST']
}
```

---

## 💡 Важно

**После ЛЮБОГО изменения .env файлов:**
1. Останови процесс (Ctrl+C)
2. Запусти снова (npm run dev / npm run combined)

Node.js загружает .env только при старте!

---

## ✅ Чеклист

- [ ] Остановлен backend (Ctrl+C)
- [ ] Остановлен frontend (Ctrl+C)
- [ ] Остановлен bot (Ctrl+C)
- [ ] Запущен backend заново
- [ ] Запущен frontend заново
- [ ] Запущен bot заново
- [ ] ngrok работает (оба туннеля)
- [ ] Команда /game21 работает
- [ ] Игра загружается (не бесконечная загрузка)

---

**После перезапуска всё заработает!** 🎉
