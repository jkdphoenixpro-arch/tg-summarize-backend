# 🚀 Деплой на Cloudflare Pages - Инструкция

## 📋 Анализ проекта

### Структура проекта:
```
├── game21/
│   ├── client/          ← ФРОНТЕНД (для Cloudflare Pages)
│   │   ├── src/
│   │   ├── public/
│   │   ├── package.json
│   │   ├── vite.config.js
│   │   └── .env.example
│   └── server/          ← БЭКЕНД (для отдельного хостинга)
├── combined-bot.js      ← Telegram бот
└── index.js
```

---

## ✅ Что нужно загрузить в Git

### 1. Обязательные файлы для Cloudflare Pages:

```
game21/client/
├── src/                    ✅ Весь исходный код
│   ├── components/
│   ├── utils/
│   ├── App.jsx
│   ├── App.css
│   ├── main.jsx
│   └── index.css
├── public/                 ✅ Статические файлы
│   └── sounds/
├── package.json            ✅ Зависимости
├── vite.config.js          ✅ Конфигурация сборки
├── index.html              ✅ HTML шаблон
└── .env.example            ✅ Пример переменных окружения
```

### 2. НЕ загружать в Git:

```
❌ node_modules/           (в .gitignore)
❌ dist/                   (в .gitignore)
❌ .env                    (в .gitignore)
❌ *.log                   (в .gitignore)
```

---

## 🔧 Подготовка к деплою

### Шаг 1: Проверить .gitignore

Убедись что в `game21/.gitignore` есть:
```
node_modules
dist
.env
.env.local
*.log
.DS_Store
```

✅ **Уже настроено правильно!**

### Шаг 2: Создать файл для Cloudflare

Создай `game21/client/.gitignore` (если нет):
```
node_modules
dist
.env
.env.local
```

### Шаг 3: Проверить package.json

В `game21/client/package.json` должен быть скрипт:
```json
{
  "scripts": {
    "build": "vite build"
  }
}
```

✅ **Уже есть!**

---

## 📤 Загрузка в Git

### Вариант 1: Загрузить весь проект

```bash
# Если еще не инициализирован Git
git init
git add .
git commit -m "Initial commit"

# Создать репозиторий на GitHub и загрузить
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

### Вариант 2: Загрузить только клиент (рекомендуется)

Создать отдельный репозиторий только для фронтенда:

```bash
cd game21/client

# Инициализировать Git
git init
git add .
git commit -m "Initial commit: Game21 client"

# Создать репозиторий на GitHub
git remote add origin https://github.com/YOUR_USERNAME/game21-client.git
git branch -M main
git push -u origin main
```

---

## 🌐 Настройка Cloudflare Pages

### Шаг 1: Создать проект

1. Зайти на https://dash.cloudflare.com/
2. Перейти в **Workers & Pages** → **Pages**
3. Нажать **Create a project**
4. Выбрать **Connect to Git**

### Шаг 2: Подключить репозиторий

1. Авторизовать GitHub
2. Выбрать репозиторий:
   - Если загрузил весь проект: `YOUR_REPO`
   - Если только клиент: `game21-client`

### Шаг 3: Настройки сборки

#### Если загрузил весь проект:
```
Project name: game21-client
Production branch: main
Build command: npm run build
Build output directory: dist
Root directory: game21/client          ← ВАЖНО!
```

#### Если загрузил только клиент:
```
Project name: game21-client
Production branch: main
Build command: npm run build
Build output directory: dist
Root directory: (оставить пустым)
```

### Шаг 4: Environment Variables

Добавить переменные окружения:

```
VITE_SOCKET_URL = https://your-backend-url.com
```

**Где взять backend URL?**
- Если используешь Render: `https://your-app.onrender.com`
- Если используешь Railway: `https://your-app.railway.app`
- Если используешь ngrok: `https://your-ngrok-url.ngrok-free.app`

### Шаг 5: Деплой

Нажать **Save and Deploy**

Cloudflare автоматически:
1. Склонирует репозиторий
2. Установит зависимости (`npm install`)
3. Соберет проект (`npm run build`)
4. Задеплоит на CDN
5. Выдаст HTTPS URL

---

## 🎯 Результат

После деплоя получишь:

```
✅ https://game21-client.pages.dev
✅ Автоматический HTTPS
✅ Безлимитный трафик
✅ CDN по всему миру
✅ Автодеплой при push в Git
```

---

## 🔄 Автоматические обновления

После настройки каждый `git push` будет автоматически деплоить новую версию:

```bash
# Внести изменения в код
cd game21/client
# ... редактировать файлы ...

# Закоммитить и запушить
git add .
git commit -m "Update game logic"
git push

# Cloudflare автоматически задеплоит через 1-2 минуты
```

---

## 🐛 Возможные проблемы

### Проблема 1: Build failed

**Причина:** Не указан Root directory

**Решение:** В настройках проекта указать `game21/client`

### Проблема 2: Blank page после деплоя

**Причина:** Не настроена переменная `VITE_SOCKET_URL`

**Решение:** 
1. Зайти в Settings → Environment variables
2. Добавить `VITE_SOCKET_URL`
3. Redeploy

### Проблема 3: CORS ошибка

**Причина:** Backend не разрешает запросы с Cloudflare домена

**Решение:** В `game21/server/server.js` добавить:
```javascript
const io = new Server(httpServer, {
  cors: {
    origin: [
      'http://localhost:5173',
      'https://game21-client.pages.dev',  // ← Добавить
      'https://your-custom-domain.com'     // ← Если есть
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});
```

---

## 📊 Чеклист деплоя

- [ ] Проверить `.gitignore` (не загружать `node_modules`, `dist`, `.env`)
- [ ] Загрузить код в GitHub
- [ ] Создать проект на Cloudflare Pages
- [ ] Подключить Git репозиторий
- [ ] Указать Root directory: `game21/client` (если весь проект)
- [ ] Указать Build command: `npm run build`
- [ ] Указать Build output: `dist`
- [ ] Добавить Environment Variable: `VITE_SOCKET_URL`
- [ ] Задеплоить
- [ ] Проверить работу на `https://your-project.pages.dev`
- [ ] Обновить CORS на backend
- [ ] Протестировать игру

---

## 💡 Рекомендации

### 1. Создать отдельные репозитории

```
game21-client/     ← Фронтенд (Cloudflare Pages)
game21-server/     ← Backend (Render/Railway)
game21-bot/        ← Telegram бот (отдельный сервер)
```

### 2. Использовать production .env

Создать `game21/client/.env.production`:
```
VITE_SOCKET_URL=https://your-backend.onrender.com
```

### 3. Добавить custom domain (опционально)

В Cloudflare Pages → Custom domains:
```
game.yourdomain.com
```

---

## 🎮 Итоговая архитектура

```
┌─────────────────────────────┐
│   Cloudflare Pages          │
│   https://game21.pages.dev  │  ← Фронтенд (React)
│   ✅ HTTPS автоматически    │
│   ✅ Безлимитный трафик     │
└──────────────┬──────────────┘
               │
               ↓ WebSocket + API
┌──────────────────────────────┐
│   Render.com / Railway       │  ← Backend (Node.js)
│   https://api.onrender.com   │
│   ✅ HTTPS автоматически     │
└──────────────┬───────────────┘
               │
               ↓
┌──────────────────────────────┐
│   MongoDB Atlas              │  ← База данных
│   ✅ 512MB бесплатно         │
└──────────────────────────────┘
```

---

## 🚀 Быстрый старт (TL;DR)

```bash
# 1. Перейти в папку клиента
cd game21/client

# 2. Инициализировать Git
git init
git add .
git commit -m "Initial commit"

# 3. Создать репозиторий на GitHub и загрузить
git remote add origin https://github.com/YOUR_USERNAME/game21-client.git
git push -u origin main

# 4. Зайти на Cloudflare Pages
# 5. Connect to Git → выбрать репозиторий
# 6. Build command: npm run build
# 7. Build output: dist
# 8. Environment variable: VITE_SOCKET_URL=https://your-backend.com
# 9. Deploy!
```

Готово! 🎉
