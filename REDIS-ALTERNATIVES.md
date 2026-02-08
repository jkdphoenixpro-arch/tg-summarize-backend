# 🔴 Альтернативы Redis для Windows

## Проблема

Docker не установлен на Windows, а Redis нужен для работы игры.

## ✅ Решения

### Вариант 1: In-Memory хранилище (Самый простой)

**Для разработки и тестирования** - используй встроенное in-memory хранилище.

#### Настройка:

1. Открой `game21/server/.env`
2. Добавь строку:
   ```env
   USE_MEMORY_STORAGE=true
   ```

3. Запусти сервер:
   ```bash
   npm run game:server
   ```

#### ⚠️ Важно:
- Данные хранятся только в памяти
- При перезапуске сервера все игры удаляются
- Подходит только для разработки
- Для продакшна используй настоящий Redis

#### ✅ Преимущества:
- Не нужно ничего устанавливать
- Работает сразу
- Идеально для тестирования

---

### Вариант 2: Memurai (Рекомендуется для Windows)

**Memurai** - это Redis-совместимый сервер для Windows.

#### Установка:

1. Скачай с официального сайта:
   https://www.memurai.com/get-memurai

2. Установи (есть бесплатная версия для разработки)

3. Memurai автоматически запустится на порту 6379

4. В `game21/server/.env`:
   ```env
   REDIS_URL=redis://localhost:6379
   # USE_MEMORY_STORAGE=true  <- закомментируй или удали
   ```

5. Запусти сервер:
   ```bash
   npm run game:server
   ```

#### ✅ Преимущества:
- Полная совместимость с Redis
- Работает как служба Windows
- Данные сохраняются при перезапуске
- Подходит для продакшна

---

### Вариант 3: Redis для Windows (от Microsoft)

**Устаревший, но рабочий вариант.**

#### Установка:

1. Скачай с GitHub:
   https://github.com/microsoftarchive/redis/releases

2. Скачай `Redis-x64-3.0.504.msi`

3. Установи

4. Redis запустится как служба Windows

5. В `game21/server/.env`:
   ```env
   REDIS_URL=redis://localhost:6379
   ```

#### ⚠️ Важно:
- Версия устаревшая (3.0)
- Не поддерживается Microsoft
- Но работает стабильно

---

### Вариант 4: WSL (Windows Subsystem for Linux)

**Если хочешь использовать настоящий Redis.**

#### Установка:

1. Открой PowerShell от администратора:
   ```powershell
   wsl --install
   ```

2. Перезагрузи компьютер

3. Открой WSL терминал (Ubuntu)

4. Установи Redis:
   ```bash
   sudo apt update
   sudo apt install redis-server
   ```

5. Запусти Redis:
   ```bash
   sudo service redis-server start
   ```

6. Проверь:
   ```bash
   redis-cli ping
   # Должно вернуть: PONG
   ```

7. В `game21/server/.env`:
   ```env
   REDIS_URL=redis://localhost:6379
   ```

#### ✅ Преимущества:
- Настоящий Redis
- Последняя версия
- Бесплатно

#### ⚠️ Недостатки:
- Нужно устанавливать WSL
- Требует перезагрузки

---

### Вариант 5: Облачный Redis (для продакшна)

**Для деплоя на продакшн.**

#### Upstash (Рекомендуется)

1. Зарегистрируйся: https://upstash.com

2. Создай Redis базу (бесплатный план: 10,000 команд/день)

3. Скопируй Redis URL

4. В `game21/server/.env`:
   ```env
   REDIS_URL=rediss://default:password@host.upstash.io:6379
   ```

#### Redis Cloud

1. Зарегистрируйся: https://redis.com/try-free/

2. Создай базу (бесплатный план: 30MB)

3. Скопируй URL

4. Обнови `.env`

---

## 🎯 Рекомендации

### Для локальной разработки:

**Вариант 1 (In-Memory)** - самый простой:
```env
USE_MEMORY_STORAGE=true
```

**Вариант 2 (Memurai)** - если нужна персистентность:
- Скачай Memurai
- Установи
- Готово!

### Для продакшна:

**Upstash** - лучший выбор:
- Бесплатный план
- Автоматическое масштабирование
- Низкая задержка

---

## 📝 Сравнение

| Вариант | Установка | Персистентность | Продакшн | Цена |
|---------|-----------|-----------------|----------|------|
| In-Memory | ✅ Нет | ❌ Нет | ❌ Нет | 🆓 |
| Memurai | ⚠️ Средне | ✅ Да | ✅ Да | 🆓/💰 |
| Redis (MS) | ⚠️ Средне | ✅ Да | ⚠️ Устарел | 🆓 |
| WSL | ⚠️ Сложно | ✅ Да | ✅ Да | 🆓 |
| Upstash | ✅ Легко | ✅ Да | ✅ Да | 🆓/💰 |

---

## 🚀 Быстрый старт

### Для тестирования (прямо сейчас):

```bash
# 1. Открой game21/server/.env
# 2. Добавь:
USE_MEMORY_STORAGE=true

# 3. Запусти
npm run game:server

# 4. Готово! ✅
```

### Для серьезной разработки:

```bash
# 1. Скачай Memurai
# https://www.memurai.com/get-memurai

# 2. Установи

# 3. В game21/server/.env:
REDIS_URL=redis://localhost:6379

# 4. Запусти
npm run game:server

# 5. Готово! ✅
```

---

## 🐛 Решение проблем

### "Cannot connect to Redis"

**Решение 1:** Используй In-Memory
```env
USE_MEMORY_STORAGE=true
```

**Решение 2:** Проверь что Redis/Memurai запущен
```bash
# Windows (Memurai)
# Открой Services (services.msc)
# Найди "Memurai" - должен быть "Running"

# WSL
sudo service redis-server status
```

### "ECONNREFUSED"

Redis не запущен. Используй In-Memory:
```env
USE_MEMORY_STORAGE=true
```

---

## 💡 Советы

1. **Для начала** используй In-Memory - проще всего
2. **Для разработки** установи Memurai - удобнее
3. **Для продакшна** используй Upstash - надежнее
4. **Не используй** In-Memory в продакшне!

---

## ✅ Проверка

После настройки проверь:

```bash
# Запусти сервер
cd game21/server
npm run dev

# Должно быть:
# ✅ In-Memory хранилище готово
# или
# ✅ Redis подключен

# Открой в браузере
http://localhost:3001

# Если работает - всё ОК! ✅
```

---

**Рекомендация:** Начни с In-Memory, потом перейди на Memurai или Upstash.
