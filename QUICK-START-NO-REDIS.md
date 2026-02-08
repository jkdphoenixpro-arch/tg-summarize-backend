# ⚡ Быстрый старт БЕЗ Redis

Самый простой способ запустить игру без установки Redis.

## 🚀 3 шага до запуска

### Шаг 1: Установка

```bash
# Из папки game21
npm run install:all
```

### Шаг 2: Настройка

Создай `game21/server/.env`:

```env
PORT=3001
USE_MEMORY_STORAGE=true
WEBAPP_URL=http://localhost:5173
```

Создай `game21/client/.env`:

```env
VITE_SOCKET_URL=http://localhost:3001
```

### Шаг 3: Запуск

```bash
# Из папки game21
npm run dev
```

## ✅ Готово!

Открой в браузере:
```
http://localhost:5173?gameId=test123
```

---

## 🎮 Интеграция с ботом

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

В группе Telegram:
```
/game21
```

---

## ⚠️ Важно

**In-Memory хранилище:**
- ✅ Не требует установки Redis
- ✅ Работает сразу
- ✅ Идеально для разработки
- ❌ Данные не сохраняются при перезапуске
- ❌ Не подходит для продакшна

**Для продакшна используй:**
- Memurai (Windows)
- Upstash (облако)
- Настоящий Redis

Подробнее: [REDIS-ALTERNATIVES.md](REDIS-ALTERNATIVES.md)

---

## 🐛 Проблемы?

### Игра не запускается

1. Проверь что `USE_MEMORY_STORAGE=true` в `server/.env`
2. Проверь что порты 3001 и 5173 свободны
3. Перезапусти сервер

### Бот не создает игру

1. Проверь что игра запущена (`npm run game:dev`)
2. Проверь `GAME_SERVER_URL` в корневом `.env`
3. Проверь логи бота

---

## 📚 Дальше

- [Полная документация](game21/README.md)
- [Альтернативы Redis](REDIS-ALTERNATIVES.md)
- [FAQ](game21/FAQ.md)

---

**Это самый быстрый способ начать!** 🚀
