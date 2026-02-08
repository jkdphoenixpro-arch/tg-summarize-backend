# 🍃 Настройка MongoDB Atlas

## Шаг 1: Создание аккаунта

1. Зайди на https://www.mongodb.com/cloud/atlas/register
2. Зарегистрируйся (бесплатно)
3. Подтверди email

## Шаг 2: Создание кластера

1. Нажми "Build a Database"
2. Выбери **FREE** (M0 Sandbox)
3. Выбери регион (ближайший к тебе, например Frankfurt)
4. Нажми "Create"

## Шаг 3: Настройка доступа

### 3.1 Создай пользователя базы данных

1. Придумай username (например: `game21user`)
2. Придумай пароль (сохрани его!)
3. Нажми "Create User"

### 3.2 Настрой IP Whitelist

1. Выбери "Add IP Address"
2. Нажми "Allow Access from Anywhere" (0.0.0.0/0)
3. Нажми "Confirm"

## Шаг 4: Получение Connection String

1. Нажми "Connect"
2. Выбери "Connect your application"
3. Driver: **Node.js**
4. Version: **5.5 or later**
5. Скопируй Connection String

Будет выглядеть так:
```
mongodb+srv://game21user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

## Шаг 5: Настройка .env

Открой `game21/server/.env` и добавь:

```env
MONGODB_URI=mongodb+srv://game21user:твой_пароль@cluster0.xxxxx.mongodb.net/game21?retryWrites=true&w=majority
```

**Важно:**
- Замени `<password>` на свой пароль
- Замени `cluster0.xxxxx` на свой адрес кластера
- Добавь `/game21` перед `?` - это имя базы данных

## Шаг 6: Установка зависимостей

```bash
cd game21/server
npm install
```

## Шаг 7: Запуск

```bash
npm run dev
```

Должно появиться:
```
✅ MongoDB подключена
🔶 Режим: In-Memory хранилище
✅ In-Memory хранилище готово
🎮 Game server запущен на порту 3001
```

## ✅ Проверка

Игра будет работать с MongoDB! Теперь:
- ✅ Баланс игроков сохраняется
- ✅ Статистика побед/поражений
- ✅ Начальный баланс 1000₽
- ✅ Ставки от 20₽ до 300₽

## 🔍 Просмотр данных

1. Зайди в MongoDB Atlas
2. Открой "Browse Collections"
3. Выбери базу `game21`
4. Коллекция `players` - все игроки

## 🐛 Проблемы

### "MongoServerError: bad auth"
- Неправильный пароль
- Проверь что пароль правильный в MONGODB_URI

### "MongoNetworkError"
- IP не в whitelist
- Добавь 0.0.0.0/0 в Network Access

### "Игра работает без MongoDB"
- Это нормально! Игра работает и без MongoDB
- Просто статистика не сохраняется

---

**Готово!** Теперь у тебя есть база данных для игры! 🎉
