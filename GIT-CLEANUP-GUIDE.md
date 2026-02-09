# 🧹 Очистка Git репозитория от лишних файлов

## 🐛 Проблема

В репозиторий загрузились:
- ❌ `node_modules/` (тысячи файлов)
- ❌ `.env` (секретные данные)
- ❌ `dist/` (собранные файлы)

## ✅ Решение

### Вариант 1: Автоматический (рекомендуется)

Запустить скрипт:
```bash
cleanup-git.bat
```

Скрипт автоматически:
1. Создаст `.gitignore`
2. Удалит лишние файлы из Git
3. Закоммитит изменения
4. Отправит на GitHub

---

### Вариант 2: Ручной

#### Шаг 1: Создать .gitignore

Файл `game21/client/.gitignore` уже создан:
```
node_modules
dist
.env
.env.local
*.log
.DS_Store
```

#### Шаг 2: Удалить файлы из Git (но оставить локально)

```bash
cd game21/client

# Удалить node_modules из Git
git rm -r --cached node_modules

# Удалить .env из Git
git rm --cached .env

# Удалить dist из Git (если есть)
git rm -r --cached dist
```

**Важно:** Флаг `--cached` удаляет файлы только из Git, но оставляет их на диске!

#### Шаг 3: Закоммитить изменения

```bash
git add .gitignore
git commit -m "Add .gitignore and remove node_modules, .env from repository"
```

#### Шаг 4: Отправить на GitHub

```bash
git push
```

---

## 🔍 Проверка результата

После выполнения команд на GitHub должны остаться только:

```
✅ src/
✅ public/
✅ package.json
✅ vite.config.js
✅ index.html
✅ .env.example
✅ .gitignore
```

И НЕ должно быть:

```
❌ node_modules/
❌ .env
❌ dist/
```

---

## 🚨 Если .env содержал секреты

Если в `.env` были API ключи или токены, нужно:

### 1. Удалить из истории Git (опционально)

```bash
# Установить BFG Repo-Cleaner
# Скачать с https://rtyley.github.io/bfg-repo-cleaner/

# Удалить .env из всей истории
java -jar bfg.jar --delete-files .env

# Очистить историю
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push
git push --force
```

### 2. Сменить все секреты

- Telegram Bot Token
- MongoDB URI
- API ключи
- Пароли

---

## 💡 Альтернатива: Создать новый репозиторий

Если проще, можно создать новый чистый репозиторий:

```bash
cd game21/client

# Удалить старый Git
rm -rf .git

# Создать новый
git init
git add .
git commit -m "Initial commit (clean)"

# Создать новый репозиторий на GitHub
# Затем:
git remote add origin https://github.com/YOUR_USERNAME/NEW_REPO.git
git push -u origin main
```

---

## 📊 Размер репозитория

### До очистки:
```
node_modules/  ~200-500 MB
.env           ~1 KB
dist/          ~1-5 MB
Итого:         ~200-500 MB
```

### После очистки:
```
src/           ~100 KB
public/        ~500 KB
configs        ~10 KB
Итого:         ~1 MB
```

**Ускорение клонирования:** в 200-500 раз! 🚀

---

## 🎯 Чеклист

- [ ] Создан `.gitignore` в `game21/client/`
- [ ] Выполнена команда `git rm -r --cached node_modules`
- [ ] Выполнена команда `git rm --cached .env`
- [ ] Закоммичены изменения
- [ ] Отправлено на GitHub (`git push`)
- [ ] Проверено на GitHub - нет `node_modules/` и `.env`
- [ ] Если были секреты в `.env` - сменены токены

---

## 🔧 Команды для копирования

```bash
# Перейти в папку клиента
cd game21/client

# Удалить лишнее из Git
git rm -r --cached node_modules
git rm --cached .env
git rm -r --cached dist

# Закоммитить
git add .gitignore
git commit -m "Add .gitignore and remove node_modules, .env"

# Отправить
git push
```

---

## ❓ FAQ

**Q: Удалятся ли файлы с моего компьютера?**  
A: Нет! Флаг `--cached` удаляет только из Git, локальные файлы остаются.

**Q: Что если команда выдает ошибку?**  
A: Это нормально если файл уже удален. Просто продолжай дальше.

**Q: Нужно ли удалять репозиторий и создавать новый?**  
A: Нет, достаточно выполнить команды выше.

**Q: Cloudflare Pages будет работать после очистки?**  
A: Да! Cloudflare сам установит `node_modules` при деплое.

---

## ✅ Готово!

После выполнения команд репозиторий будет чистым и готовым к деплою на Cloudflare Pages! 🎉
