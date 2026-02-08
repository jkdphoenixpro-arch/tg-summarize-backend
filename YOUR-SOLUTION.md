# 🎯 Решение твоей проблемы

## Что у тебя не работает

1. ✅ Backend запущен (порт 3001)
2. ✅ Frontend запущен (порт 5173)
3. ✅ Бот запущен
4. ❌ Бесконечная загрузка в браузере
5. ❌ Ошибка "Only HTTPS links allowed" в Telegram

## Причина

**Telegram WebApp работает только через HTTPS.**

`http://localhost` не работает в Telegram (но работает в браузере для теста).

---

## ✅ Решение: ngrok

### Шаг 1: Скачай ngrok

1. Зайди на https://ngrok.com/download
2. Скачай для Windows
3. Распакуй `ngrok.exe` в папку `E:\MyProjects\ToxicBot`

### Шаг 2: Зарегистрируйся (опционально)

1. Зарегистрируйся на https://ngrok.com
2. Получи authtoken: https://dashboard.ngrok.com/get-started/your-authtoken
3. В терминале:
   ```bash
   ngrok config add-authtoken <твой_токен>
   ```

### Шаг 3: Запусти ngrok (2 новых терминала)

**Терминал 4 (ngrok Backend):**
```bash
ngrok http 3001
```

Увидишь что-то вроде:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3001
```

**Скопируй этот URL:** `https://abc123.ngrok-free.app`

**Терминал 5 (ngrok Frontend):**
```bash
ngrok http 5173
```

Увидишь:
```
Forwarding  https://xyz789.ngrok-free.app -> http://localhost:5173
```

**Скопируй этот URL:** `https://xyz789.ngrok-free.app`

### Шаг 4: Обнови .env файлы

**Файл `.env` (корень проекта):**
```env
BOT_TOKEN=твой_токен
GROQ_API_KEY=твой_ключ
TARGET_CHAT_ID=-1003837037003
MESSAGE_LIMIT=150

# Замени на ngrok URLs
GAME_SERVER_URL=https://abc123.ngrok-free.app
WEBAPP_URL=https://xyz789.ngrok-free.app
```

**Файл `game21/server/.env`:**
```env
PORT=3001
USE_MEMORY_STORAGE=true

# Замени на ngrok frontend URL
WEBAPP_URL=https://xyz789.ngrok-free.app
```

**Файл `game21/client/.env`:**
```env
# Замени на ngrok backend URL
VITE_SOCKET_URL=https://abc123.ngrok-free.app
```

### Шаг 5: Перезапусти backend и frontend

**В терминале 1 (backend):**
1. Нажми `Ctrl+C`
2. Запусти снова:
   ```bash
   cd game21/server
   npm run dev
   ```

**В терминале 2 (frontend):**
1. Нажми `Ctrl+C`
2. Запусти снова:
   ```bash
   cd game21/client
   npm run dev
   ```

### Шаг 6: Перезапусти бота

**В терминале 3 (bot):**
1. Нажми `Ctrl+C`
2. Запусти снова:
   ```bash
   npm run combined
   ```

### Шаг 7: Проверь!

**В браузере:**
```
https://xyz789.ngrok-free.app?gameId=test123
```

Игра должна загрузиться (не бесконечная загрузка).

**В Telegram:**
```
/game21
```

Кнопка должна работать без ошибки!

---

## 📊 Итоговая структура

У тебя должно быть **5 терминалов**:

1. **Backend** - `cd game21/server && npm run dev`
2. **Frontend** - `cd game21/client && npm run dev`
3. **Bot** - `npm run combined`
4. **ngrok Backend** - `ngrok http 3001`
5. **ngrok Frontend** - `ngrok http 5173`

---

## 🐛 Если всё ещё не работает

### Бесконечная загрузка

**Проверь:**
1. `VITE_SOCKET_URL` в `game21/client/.env` - должен быть ngrok backend URL
2. Frontend перезапущен после изменения .env
3. Backend работает (проверь терминал 1)

**Открой консоль браузера (F12):**
- Должны быть сообщения о подключении к Socket.io
- Не должно быть ошибок подключения

### "Only HTTPS links allowed"

**Проверь:**
1. `WEBAPP_URL` в корневом `.env` - должен быть ngrok frontend URL (https://)
2. Бот перезапущен после изменения .env
3. ngrok frontend работает (проверь терминал 5)

### ngrok не работает

**Ошибка "ERR_NGROK_108":**
```bash
ngrok config add-authtoken <твой_токен>
```

**Ошибка "command not found":**
- Положи `ngrok.exe` в папку проекта
- Запускай как `./ngrok http 3001`

---

## ✅ Чеклист

- [ ] ngrok скачан и распакован
- [ ] Запущен `ngrok http 3001` (терминал 4)
- [ ] Запущен `ngrok http 5173` (терминал 5)
- [ ] Скопированы оба ngrok URL
- [ ] Обновлен корневой `.env` с ngrok URLs
- [ ] Обновлен `game21/server/.env` с ngrok frontend URL
- [ ] Обновлен `game21/client/.env` с ngrok backend URL
- [ ] Перезапущен backend (Ctrl+C, npm run dev)
- [ ] Перезапущен frontend (Ctrl+C, npm run dev)
- [ ] Перезапущен bot (Ctrl+C, npm run combined)
- [ ] Игра загружается через ngrok URL в браузере
- [ ] Команда /game21 работает в Telegram без ошибки

---

## 💡 Совет

**Сохрани ngrok URLs в блокнот!**

ngrok URLs меняются при каждом перезапуске (бесплатная версия).
Каждый раз когда перезапускаешь ngrok - нужно обновлять .env файлы.

**Платная версия ngrok ($8/месяц):**
- Статические URLs (не меняются)
- Не нужно обновлять .env каждый раз

---

## 🎉 После настройки

Всё заработает:
- ✅ Игра загружается в браузере
- ✅ Команда /game21 работает в Telegram
- ✅ WebApp открывается из Telegram
- ✅ Можно играть с друзьями

---

**Удачи!** 🚀

📖 Подробнее: [NGROK-SETUP.md](NGROK-SETUP.md) | [FIX-HTTPS-ISSUE.md](FIX-HTTPS-ISSUE.md)
