# 🚀 Быстрый старт

## 1. Установка

```bash
# Из папки game21
npm run install:all
```

## 2. Запуск Redis

**Вариант 1: In-Memory (без установки Redis) - Рекомендуется для начала**

В `server/.env` добавь:
```env
USE_MEMORY_STORAGE=true
```

⚠️ Данные не сохраняются при перезапуске!

**Вариант 2: Docker**
```bash
docker run -d -p 6379:6379 redis
```

**Вариант 3: Memurai (для Windows)**
Скачай с https://www.memurai.com/get-memurai

**Вариант 4: WSL (Windows)**
```bash
wsl --install
# После перезагрузки:
sudo apt install redis-server
sudo service redis-server start
```

Подробнее: [REDIS-ALTERNATIVES.md](../REDIS-ALTERNATIVES.md)

## 3. Настройка

Создай `server/.env`:
```env
PORT=3001
REDIS_URL=redis://localhost:6379
```

Создай `client/.env`:
```env
VITE_SOCKET_URL=http://localhost:3001
```

## 4. Запуск для разработки

```bash
# Из папки game21
npm run dev
```

Откроется:
- Backend: http://localhost:3001
- Frontend: http://localhost:5173

## 5. Интеграция с ботом

В корневом `.env` добавь:
```env
GAME_SERVER_URL=http://localhost:3001
WEBAPP_URL=http://localhost:5173
```

Запусти бота:
```bash
# Из корня проекта
npm run combined
```

## 6. Тестирование

### Без Telegram:
Открой http://localhost:5173 в браузере

### С Telegram:
1. Добавь бота в группу
2. Напиши `/game21`
3. Нажми кнопку "🎮 Играть"

## 🎮 Готово!

Игра работает! Пригласи друзей в группу и играйте вместе.

## ⚠️ Важно для продакшна

Для работы в Telegram WebApp нужен **HTTPS**. 

Используй:
- ngrok (для тестирования)
- Vercel/Netlify (для клиента)
- Railway/Render (для сервера)
