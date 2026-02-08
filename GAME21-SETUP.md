# 🎴 Настройка игры 21 Очко

## Шаг 1: Установка зависимостей

```bash
# Установи зависимости для игры
npm run game:install
```

## Шаг 2: Установка и запуск Redis

Redis нужен для хранения состояния игр.

### Windows

**Вариант 1: Docker (рекомендуется)**
```bash
docker run -d -p 6379:6379 --name redis redis
```

**Вариант 2: WSL**
```bash
wsl
sudo apt update
sudo apt install redis-server
redis-server
```

### Linux

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install redis-server
sudo systemctl start redis

# Проверка
redis-cli ping
# Должно вернуть: PONG
```

### macOS

```bash
brew install redis
brew services start redis

# Проверка
redis-cli ping
```

## Шаг 3: Настройка переменных окружения

### 3.1 Настройка сервера

Создай файл `game21/server/.env`:

```env
PORT=3001
REDIS_URL=redis://localhost:6379
TELEGRAM_BOT_TOKEN=твой_токен_бота
WEBAPP_URL=http://localhost:5173
```

### 3.2 Настройка клиента

Создай файл `game21/client/.env`:

```env
VITE_SOCKET_URL=http://localhost:3001
```

### 3.3 Настройка основного бота

В корневом `.env` добавь:

```env
GAME_SERVER_URL=http://localhost:3001
WEBAPP_URL=http://localhost:5173
```

## Шаг 4: Запуск для разработки

### Вариант 1: Запустить всё вместе

```bash
# Из папки game21
cd game21
npm run dev
```

Это запустит:
- Backend на http://localhost:3001
- Frontend на http://localhost:5173

### Вариант 2: Запустить по отдельности

**Терминал 1 - Backend:**
```bash
npm run game:server
```

**Терминал 2 - Frontend:**
```bash
npm run game:client
```

**Терминал 3 - Telegram бот:**
```bash
npm run combined
```

## Шаг 5: Тестирование

### Тест 1: Без Telegram

1. Открой http://localhost:5173 в браузере
2. Введи любой game ID (например: `test123`)
3. Игра должна загрузиться с тестовым пользователем

### Тест 2: С Telegram (локально)

Для локального тестирования нужен HTTPS. Используй ngrok:

```bash
# Установи ngrok
# https://ngrok.com/download

# Запусти туннель для клиента
ngrok http 5173

# Запусти туннель для сервера (в другом терминале)
ngrok http 3001
```

Обнови переменные окружения с ngrok URL:
```env
GAME_SERVER_URL=https://your-server.ngrok.io
WEBAPP_URL=https://your-client.ngrok.io
```

### Тест 3: В группе Telegram

1. Добавь бота в группу
2. Напиши `/game21`
3. Нажми кнопку "🎮 Играть"
4. Пригласи друзей присоединиться

## Шаг 6: Деплой на продакшн

### 6.1 Backend (Railway)

```bash
cd game21/server

# Установи Railway CLI
npm i -g @railway/cli

# Залогинься
railway login

# Создай проект
railway init

# Добавь переменные окружения в Railway Dashboard:
# PORT=3001
# REDIS_URL=твой_redis_url
# WEBAPP_URL=твой_frontend_url

# Деплой
railway up
```

### 6.2 Frontend (Vercel)

```bash
cd game21/client

# Установи Vercel CLI
npm i -g vercel

# Деплой
vercel --prod

# Добавь переменную окружения в Vercel Dashboard:
# VITE_SOCKET_URL=твой_backend_url
```

### 6.3 Redis (Upstash)

1. Зарегистрируйся на https://upstash.com
2. Создай Redis базу
3. Скопируй URL подключения
4. Обнови `REDIS_URL` в Railway

### 6.4 Обнови бота

В корневом `.env`:
```env
GAME_SERVER_URL=https://твой-backend.railway.app
WEBAPP_URL=https://твой-frontend.vercel.app
```

Перезапусти бота:
```bash
npm run combined
```

## 🎮 Готово!

Теперь команда `/game21` работает в твоем боте!

## 🐛 Решение проблем

### Redis не подключается

```bash
# Проверь что Redis запущен
redis-cli ping

# Если не работает, перезапусти
# Docker:
docker restart redis

# Linux:
sudo systemctl restart redis

# macOS:
brew services restart redis
```

### Frontend не подключается к Backend

1. Проверь что оба сервера запущены
2. Проверь CORS настройки в `server/server.js`
3. Проверь `VITE_SOCKET_URL` в `client/.env`

### Telegram WebApp не открывается

1. Убедись что используешь HTTPS (ngrok для теста)
2. Проверь что `WEBAPP_URL` правильный в `.env`
3. Проверь логи бота при выполнении `/game21`

### Игра не сохраняет состояние

1. Проверь подключение к Redis
2. Проверь логи сервера
3. Убедись что `REDIS_URL` правильный

## 📚 Дополнительные ресурсы

- [Полная документация](game21/README.md)
- [Быстрый старт](game21/QUICK-START.md)
- [Telegram WebApp API](https://core.telegram.org/bots/webapps)
- [Socket.io документация](https://socket.io/docs/)

## 💡 Советы

1. **Для разработки** используй ngrok для HTTPS
2. **Для продакшна** обязательно используй HTTPS хостинг
3. **Redis** можно заменить на in-memory хранилище для теста
4. **Логи** помогут найти проблемы - смотри консоль сервера

---

Если возникли проблемы - проверь логи сервера и бота! 🚀
