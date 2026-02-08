# 🚀 Гайд по деплою

Пошаговая инструкция для деплоя бота и игры на продакшн.

## 📋 Что нужно

- [ ] Аккаунт на [Vercel](https://vercel.com) (бесплатно)
- [ ] Аккаунт на [Railway](https://railway.app) (бесплатный trial)
- [ ] Аккаунт на [Upstash](https://upstash.com) (бесплатный план)
- [ ] VPS или хостинг для бота (опционально)

---

## 🎮 Часть 1: Деплой игры

### Шаг 1: Redis на Upstash

1. Зарегистрируйся на https://upstash.com
2. Создай новую Redis базу:
   - Нажми "Create Database"
   - Выбери регион (ближайший к пользователям)
   - Нажми "Create"
3. Скопируй **Redis URL** (будет нужен позже)

### Шаг 2: Backend на Railway

```bash
# Установи Railway CLI
npm i -g @railway/cli

# Перейди в папку сервера
cd game21/server

# Залогинься
railway login

# Создай новый проект
railway init

# Деплой
railway up
```

**Добавь переменные окружения в Railway Dashboard:**
```env
PORT=3001
REDIS_URL=<твой_upstash_redis_url>
WEBAPP_URL=<будет_после_деплоя_frontend>
```

**Получи URL сервера:**
```bash
railway domain
# Например: https://game21-server.up.railway.app
```

### Шаг 3: Frontend на Vercel

```bash
# Установи Vercel CLI
npm i -g vercel

# Перейди в папку клиента
cd game21/client

# Залогинься
vercel login

# Деплой
vercel

# Добавь переменную окружения в Vercel Dashboard:
# VITE_SOCKET_URL=<твой_railway_backend_url>

# Продакшн деплой
vercel --prod
```

**Получи URL клиента:**
```
# Например: https://game21.vercel.app
```

### Шаг 4: Обнови Railway

Вернись в Railway Dashboard и обнови:
```env
WEBAPP_URL=https://game21.vercel.app
```

---

## 🤖 Часть 2: Деплой бота

### Вариант 1: Railway (рекомендуется)

```bash
# Из корня проекта
railway init

# Создай railway.json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node combined-bot.js"
  }
}

# Добавь переменные окружения в Railway Dashboard
# (все из .env файла)

# Деплой
railway up
```

### Вариант 2: VPS (Ubuntu)

```bash
# Подключись к VPS
ssh user@your-server.com

# Установи Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Клонируй репозиторий
git clone <your-repo>
cd <repo-name>

# Установи зависимости
npm install

# Создай .env файл
nano .env
# (вставь все переменные)

# Установи PM2
npm install -g pm2

# Запусти бота
pm2 start combined-bot.js --name telegram-bot

# Автозапуск при перезагрузке
pm2 startup
pm2 save

# Проверь статус
pm2 status
pm2 logs telegram-bot
```

### Вариант 3: Heroku

```bash
# Установи Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Залогинься
heroku login

# Создай приложение
heroku create your-bot-name

# Добавь переменные окружения
heroku config:set BOT_TOKEN=your_token
heroku config:set GROQ_API_KEY=your_key
# ... и остальные

# Создай Procfile
echo "worker: node combined-bot.js" > Procfile

# Деплой
git push heroku main

# Проверь логи
heroku logs --tail
```

---

## 🔧 Часть 3: Финальная настройка

### Обнови переменные бота

В Railway/VPS/Heroku обнови `.env`:
```env
GAME_SERVER_URL=https://game21-server.up.railway.app
WEBAPP_URL=https://game21.vercel.app
```

### Перезапусти бота

**Railway:**
```bash
railway restart
```

**VPS:**
```bash
pm2 restart telegram-bot
```

**Heroku:**
```bash
heroku restart
```

---

## ✅ Проверка

### 1. Проверь игру

Открой в браузере:
```
https://game21.vercel.app?gameId=test123
```

Должна загрузиться игра.

### 2. Проверь бота

В Telegram:
```
/start
```

Бот должен ответить.

### 3. Проверь команду игры

В группе:
```
/game21
```

Должна появиться кнопка "🎮 Играть".

### 4. Проверь игру в Telegram

Нажми кнопку - должна открыться игра.

---

## 🐛 Решение проблем

### Игра не загружается

1. **Проверь логи backend:**
   ```bash
   railway logs
   ```

2. **Проверь Redis:**
   - Зайди в Upstash Dashboard
   - Проверь что база активна
   - Проверь `REDIS_URL` в Railway

3. **Проверь CORS:**
   В `game21/server/server.js` должно быть:
   ```javascript
   cors: {
     origin: process.env.WEBAPP_URL,
     methods: ['GET', 'POST']
   }
   ```

### Бот не отвечает

1. **Проверь логи:**
   ```bash
   # Railway
   railway logs
   
   # VPS
   pm2 logs telegram-bot
   
   # Heroku
   heroku logs --tail
   ```

2. **Проверь переменные окружения:**
   - `BOT_TOKEN` правильный?
   - `GROQ_API_KEY` правильный?

3. **Проверь что бот запущен:**
   ```bash
   # Railway
   railway status
   
   # VPS
   pm2 status
   
   # Heroku
   heroku ps
   ```

### WebApp не открывается

1. **Проверь HTTPS:**
   - Vercel автоматически дает HTTPS
   - Railway тоже
   - Если свой домен - настрой SSL

2. **Проверь `WEBAPP_URL`:**
   - Должен быть HTTPS
   - Без слеша в конце
   - Правильный домен

3. **Проверь Telegram WebApp:**
   - Открой в браузере напрямую
   - Проверь консоль (F12)

---

## 📊 Мониторинг

### Railway

Dashboard показывает:
- CPU usage
- Memory usage
- Логи в реальном времени
- Метрики

### Upstash

Dashboard показывает:
- Количество команд
- Использование памяти
- Количество ключей

### Vercel

Dashboard показывает:
- Количество запросов
- Время ответа
- Ошибки

---

## 💰 Стоимость

### Бесплатные планы

- **Vercel:** Бесплатно (100GB bandwidth)
- **Railway:** $5 trial credit
- **Upstash:** 10,000 команд/день бесплатно
- **Heroku:** Нет бесплатного плана (с 2022)

### Платные планы

- **Railway:** $5/месяц за проект
- **Vercel Pro:** $20/месяц
- **Upstash Pro:** от $10/месяц

### Рекомендация

Для начала используй бесплатные планы. Когда вырастешь - переходи на платные.

---

## 🔄 Обновление

### Обновить игру

**Frontend:**
```bash
cd game21/client
vercel --prod
```

**Backend:**
```bash
cd game21/server
railway up
```

### Обновить бота

**Railway:**
```bash
railway up
```

**VPS:**
```bash
git pull
npm install
pm2 restart telegram-bot
```

**Heroku:**
```bash
git push heroku main
```

---

## 📝 Чеклист деплоя

- [ ] Redis на Upstash создан
- [ ] Backend на Railway задеплоен
- [ ] Frontend на Vercel задеплоен
- [ ] Переменные окружения настроены
- [ ] Бот задеплоен
- [ ] Игра открывается в браузере
- [ ] Бот отвечает в Telegram
- [ ] Команда `/game21` работает
- [ ] WebApp открывается из Telegram
- [ ] Игра работает в Telegram

---

## 🎉 Готово!

Теперь твой бот и игра работают в продакшне!

**Полезные ссылки:**
- [Railway Docs](https://docs.railway.app)
- [Vercel Docs](https://vercel.com/docs)
- [Upstash Docs](https://docs.upstash.com)
- [Telegram Bot API](https://core.telegram.org/bots/api)

---

**Нужна помощь?** Проверь [FAQ](game21/FAQ.md) или открой issue!
