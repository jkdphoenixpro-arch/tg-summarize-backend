# 🌐 Настройка ngrok для локального тестирования

## Проблема

Telegram WebApp работает **только через HTTPS**. 
Локальный `http://localhost` не работает в Telegram.

## Решение: ngrok

ngrok создает HTTPS туннель к твоему локальному серверу.

---

## Шаг 1: Установка ngrok

### Вариант 1: Скачать с сайта (рекомендуется)

1. Зайди на https://ngrok.com/download
2. Скачай для Windows
3. Распакуй `ngrok.exe` в папку проекта или в `C:\Windows\System32`

### Вариант 2: Chocolatey

```bash
choco install ngrok
```

### Вариант 3: Scoop

```bash
scoop install ngrok
```

---

## Шаг 2: Регистрация (опционально, но рекомендуется)

1. Зарегистрируйся на https://ngrok.com
2. Получи authtoken
3. Настрой:
   ```bash
   ngrok config add-authtoken <твой_токен>
   ```

Это даст тебе:
- Более длинные сессии
- Статистику
- Больше туннелей одновременно

---

## Шаг 3: Запуск ngrok

Тебе нужно **2 туннеля** (backend и frontend):

### Терминал 1: Backend туннель

```bash
ngrok http 3001
```

Скопируй URL, например: `https://abc123.ngrok-free.app`

### Терминал 2: Frontend туннель

```bash
ngrok http 5173
```

Скопируй URL, например: `https://xyz789.ngrok-free.app`

---

## Шаг 4: Обновление .env файлов

### Корневой `.env`:

```env
BOT_TOKEN=твой_токен
GROQ_API_KEY=твой_ключ

# Замени на ngrok URLs
GAME_SERVER_URL=https://abc123.ngrok-free.app
WEBAPP_URL=https://xyz789.ngrok-free.app
```

### `game21/server/.env`:

```env
PORT=3001
USE_MEMORY_STORAGE=true

# Замени на ngrok frontend URL
WEBAPP_URL=https://xyz789.ngrok-free.app
```

### `game21/client/.env`:

```env
# Замени на ngrok backend URL
VITE_SOCKET_URL=https://abc123.ngrok-free.app
```

---

## Шаг 5: Перезапуск

1. **Останови все** (Ctrl+C в каждом терминале)
2. **Перезапусти:**
   - Backend: `cd game21/server && npm run dev`
   - Frontend: `cd game21/client && npm run dev`
   - Bot: `npm run combined`

---

## Шаг 6: Проверка

### В браузере:

Открой ngrok frontend URL:
```
https://xyz789.ngrok-free.app?gameId=test
```

Должна загрузиться игра.

### В Telegram:

```
/game21
```

Теперь кнопка должна работать!

---

## 🎯 Полная структура запуска с ngrok

### Терминал 1: Backend
```bash
cd game21/server
npm run dev
```

### Терминал 2: Frontend
```bash
cd game21/client
npm run dev
```

### Терминал 3: ngrok Backend
```bash
ngrok http 3001
# Скопируй URL
```

### Терминал 4: ngrok Frontend
```bash
ngrok http 5173
# Скопируй URL
```

### Терминал 5: Bot
```bash
# Обнови .env с ngrok URLs
npm run combined
```

---

## 💡 Советы

### 1. Используй один ngrok для обоих

Можно использовать только frontend ngrok и настроить proxy:

```bash
# Только frontend
ngrok http 5173
```

Тогда в `client/.env`:
```env
VITE_SOCKET_URL=http://localhost:3001
```

Но это работает только если backend и frontend на одной машине.

### 2. Сохрани ngrok URLs

ngrok URLs меняются при каждом перезапуске (бесплатная версия).
Сохрани их в блокнот чтобы не копировать каждый раз.

### 3. Платная версия ngrok

За $8/месяц получишь:
- Статические URLs (не меняются)
- Больше туннелей
- Без ограничений

---

## 🐛 Проблемы

### "ngrok not found"

Добавь ngrok в PATH или положи `ngrok.exe` в папку проекта.

### "ERR_NGROK_108"

Нужна регистрация:
```bash
ngrok config add-authtoken <токен>
```

### "Too many connections"

Бесплатная версия ограничена. Подожди или купи платную.

### Frontend не подключается к Backend

Проверь:
1. `VITE_SOCKET_URL` в `client/.env` - должен быть ngrok backend URL
2. `WEBAPP_URL` в `server/.env` - должен быть ngrok frontend URL
3. CORS в `server/server.js` - должен разрешать ngrok frontend

---

## 🔄 Альтернативы ngrok

### 1. localtunnel

```bash
npm install -g localtunnel
lt --port 3001
lt --port 5173
```

### 2. serveo

```bash
ssh -R 80:localhost:3001 serveo.net
ssh -R 80:localhost:5173 serveo.net
```

### 3. cloudflared

```bash
cloudflared tunnel --url http://localhost:3001
cloudflared tunnel --url http://localhost:5173
```

---

## ✅ Чеклист

- [ ] ngrok установлен
- [ ] ngrok зарегистрирован (authtoken)
- [ ] Запущен ngrok для backend (3001)
- [ ] Запущен ngrok для frontend (5173)
- [ ] Обновлены все .env файлы с ngrok URLs
- [ ] Перезапущены backend, frontend, bot
- [ ] Игра открывается через ngrok URL
- [ ] Команда /game21 работает в Telegram

---

## 📝 Пример полной настройки

### 1. Запусти ngrok:

```bash
# Терминал 1
ngrok http 3001
# URL: https://abc123.ngrok-free.app

# Терминал 2
ngrok http 5173
# URL: https://xyz789.ngrok-free.app
```

### 2. Обнови .env:

**Корневой `.env`:**
```env
GAME_SERVER_URL=https://abc123.ngrok-free.app
WEBAPP_URL=https://xyz789.ngrok-free.app
```

**`game21/server/.env`:**
```env
WEBAPP_URL=https://xyz789.ngrok-free.app
```

**`game21/client/.env`:**
```env
VITE_SOCKET_URL=https://abc123.ngrok-free.app
```

### 3. Перезапусти всё:

```bash
# Останови все (Ctrl+C)
# Запусти снова:
start-all.bat
```

### 4. Проверь:

```
https://xyz789.ngrok-free.app?gameId=test
```

---

**Готово!** Теперь игра работает в Telegram! 🎉

📖 Для продакшна используй настоящий хостинг: [DEPLOY-GUIDE.md](DEPLOY-GUIDE.md)
