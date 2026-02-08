# 🎯 НАЧНИ ЗДЕСЬ

## Привет! 👋

Ты хочешь запустить игру в 21 очко для Telegram бота, но **у тебя нет Docker**.

**Не проблема!** Я создал для тебя **In-Memory хранилище** - игра будет работать без Redis!

---

## ⚡ Запуск за 5 минут

### 1️⃣ Установка (2 минуты)

```bash
# Из корня проекта
npm install

# Установка игры
cd game21
npm install
cd server
npm install
cd ../client
npm install
cd ../..
```

### 2️⃣ Настройка (2 минуты)

**Корневой `.env` (для бота):**
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

### 3️⃣ Запуск (1 минута)

**Вариант 1: Автоматически (Windows)**

Просто запусти:
```
start-all.bat
```

**Вариант 2: Вручную (3 терминала)**

Терминал 1:
```bash
cd game21/server
npm run dev
```

Терминал 2:
```bash
cd game21/client
npm run dev
```

Терминал 3:
```bash
npm run combined
```

**Готово!** 

- Игра: http://localhost:5173?gameId=test
- Бот: `/game21` в Telegram группе

---

## 🤖 Интеграция с ботом

**В корневом `.env` добавь:**
```env
GAME_SERVER_URL=http://localhost:3001
WEBAPP_URL=http://localhost:5173
```

**Запусти бота:**
```bash
cd ..
npm run combined
```

**В Telegram группе:**
```
/game21
```

---

## ⚠️ Важно знать

### In-Memory хранилище:

✅ **Плюсы:**
- Не нужен Redis
- Работает сразу
- Идеально для разработки

❌ **Минусы:**
- Данные не сохраняются при перезапуске
- Не подходит для продакшна

### Telegram WebApp требует HTTPS:

⚠️ **Важно:**
- `http://localhost` работает только в браузере
- Для Telegram нужен HTTPS
- Используй **ngrok** для локального тестирования

📖 **Решение:** [FIX-HTTPS-ISSUE.md](FIX-HTTPS-ISSUE.md) | [NGROK-SETUP.md](NGROK-SETUP.md)

### Для продакшна:

Когда будешь готов к деплою, используй:
- **Memurai** (для Windows) - https://www.memurai.com
- **Upstash** (облако) - https://upstash.com
- **WSL + Redis** (Linux на Windows)

📖 Подробнее: [REDIS-ALTERNATIVES.md](REDIS-ALTERNATIVES.md)

---

## 📚 Документация

### Быстрый старт:
- **[QUICK-START-NO-REDIS.md](QUICK-START-NO-REDIS.md)** ⭐ Начни здесь!
- [game21/QUICK-START.md](game21/QUICK-START.md) - С Redis

### Альтернативы Redis:
- **[REDIS-ALTERNATIVES.md](REDIS-ALTERNATIVES.md)** ⭐ Все варианты

### Полная документация:
- [README.md](README.md) - Главная страница
- [game21/README.md](game21/README.md) - Документация игры
- [game21/FAQ.md](game21/FAQ.md) - Частые вопросы

### Помощь:
- [COMMANDS.md](COMMANDS.md) - Все команды
- [CHECKLIST.md](CHECKLIST.md) - Чеклист
- [game21/CHEATSHEET.md](game21/CHEATSHEET.md) - Шпаргалка

---

## 🎮 Что дальше?

1. **Протестируй локально:**
   ```bash
   npm run game:dev
   http://localhost:5173?gameId=test
   ```

2. **Попробуй в Telegram:**
   ```bash
   npm run combined
   # В группе: /game21
   ```

3. **Пригласи друзей играть!** 🎴

4. **Когда будешь готов к деплою:**
   - [DEPLOY-GUIDE.md](DEPLOY-GUIDE.md)
   - [REDIS-ALTERNATIVES.md](REDIS-ALTERNATIVES.md)

---

## 🐛 Проблемы?

### Игра не запускается

```bash
# Проверь что USE_MEMORY_STORAGE=true в server/.env
cat game21/server/.env

# Перезапусти
cd game21
npm run dev
```

### Бот не создает игру

```bash
# Проверь что игра запущена
# Должно быть: ✅ In-Memory хранилище готово

# Проверь переменные в корневом .env
cat .env
```

### Нужна помощь?

- [game21/FAQ.md](game21/FAQ.md) - 40+ вопросов и ответов
- [REDIS-ALTERNATIVES.md](REDIS-ALTERNATIVES.md) - Все про Redis

---

## 💡 Совет

**Для начала используй In-Memory** - это самый простой способ!

Когда освоишься и захочешь деплоить - установи Memurai или используй Upstash.

---

## ✅ Быстрая проверка

```bash
# 1. Установка
cd game21
npm run install:all

# 2. Настройка
echo "PORT=3001" > server/.env
echo "USE_MEMORY_STORAGE=true" >> server/.env
echo "WEBAPP_URL=http://localhost:5173" >> server/.env
echo "VITE_SOCKET_URL=http://localhost:3001" > client/.env

# 3. Запуск
npm run dev

# 4. Тест
# Открой: http://localhost:5173?gameId=test
```

---

## 🎉 Готово!

Теперь у тебя работает игра в 21 очко **без Docker и без Redis**!

**Следующие шаги:**
1. ✅ Протестируй игру
2. ✅ Интегрируй с ботом
3. ✅ Пригласи друзей
4. ✅ Наслаждайся! 🎴

---

**Удачи!** 🚀

P.S. Если что-то не работает - проверь [FAQ](game21/FAQ.md) или [REDIS-ALTERNATIVES.md](REDIS-ALTERNATIVES.md)
