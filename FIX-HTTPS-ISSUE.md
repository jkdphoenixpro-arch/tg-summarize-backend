# 🔧 Исправление проблемы HTTPS

## Твоя проблема

```
Only HTTPS links are allowed
```

Telegram WebApp работает **только через HTTPS**.
`http://localhost` не работает в Telegram (но работает в браузере).

---

## ✅ Быстрое решение

### Шаг 1: Установи ngrok

Скачай с https://ngrok.com/download и распакуй в папку проекта.

### Шаг 2: Запусти ngrok

Открой **2 новых терминала**:

**Терминал 1:**
```bash
ngrok http 3001
```

Скопируй URL (например: `https://abc123.ngrok-free.app`)

**Терминал 2:**
```bash
ngrok http 5173
```

Скопируй URL (например: `https://xyz789.ngrok-free.app`)

### Шаг 3: Обнови .env файлы

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

### Шаг 4: Перезапусти backend и frontend

В терминалах где запущены backend и frontend:
1. Нажми `Ctrl+C`
2. Запусти снова:
   ```bash
   npm run dev
   ```

### Шаг 5: Запусти бота

```bash
npm run combined
```

### Шаг 6: Проверь в Telegram

```
/game21
```

Теперь должно работать! ✅

---

## 🎯 Структура запуска

Тебе нужно **5 терминалов**:

1. **Backend** - `cd game21/server && npm run dev`
2. **Frontend** - `cd game21/client && npm run dev`
3. **ngrok Backend** - `ngrok http 3001`
4. **ngrok Frontend** - `ngrok http 5173`
5. **Bot** - `npm run combined`

---

## 🐛 Если не работает

### Проблема: Бесконечная загрузка

**Причина:** Frontend не может подключиться к backend.

**Решение:**
1. Проверь `VITE_SOCKET_URL` в `game21/client/.env`
2. Должен быть ngrok backend URL (https://abc123.ngrok-free.app)
3. Перезапусти frontend

### Проблема: "Only HTTPS links allowed"

**Причина:** В .env файлах остались http:// ссылки.

**Решение:**
1. Проверь все .env файлы
2. Замени все `http://localhost` на ngrok URLs
3. Перезапусти бота

### Проблема: ngrok URLs не работают

**Причина:** ngrok требует регистрации.

**Решение:**
```bash
ngrok config add-authtoken <твой_токен>
```

Получи токен на https://dashboard.ngrok.com/get-started/your-authtoken

---

## 💡 Альтернатива: Тестируй в браузере

Если не хочешь возиться с ngrok, тестируй игру в браузере:

```
http://localhost:5173?gameId=test123
```

Это работает без HTTPS. Но в Telegram всё равно нужен ngrok.

---

## 📖 Подробная инструкция

См. [NGROK-SETUP.md](NGROK-SETUP.md)

---

## ✅ Чеклист

- [ ] ngrok установлен
- [ ] Запущен `ngrok http 3001`
- [ ] Запущен `ngrok http 5173`
- [ ] Скопированы оба ngrok URL
- [ ] Обновлены все 3 .env файла
- [ ] Перезапущены backend и frontend
- [ ] Запущен бот
- [ ] Команда /game21 работает

---

**После настройки ngrok всё заработает!** 🎉
