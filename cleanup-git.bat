@echo off
echo ========================================
echo Очистка Git репозитория от лишних файлов
echo ========================================
echo.

cd game21\client

echo [1/5] Удаление node_modules из Git...
git rm -r --cached node_modules
if errorlevel 1 (
    echo node_modules уже удален или не найден
)

echo.
echo [2/5] Удаление .env из Git...
git rm --cached .env
if errorlevel 1 (
    echo .env уже удален или не найден
)

echo.
echo [3/5] Удаление dist из Git (если есть)...
git rm -r --cached dist
if errorlevel 1 (
    echo dist не найден (это нормально)
)

echo.
echo [4/5] Коммит изменений...
git add .gitignore
git commit -m "Add .gitignore and remove node_modules, .env from repository"

echo.
echo [5/5] Отправка изменений на GitHub...
git push

echo.
echo ========================================
echo ✅ Готово! Репозиторий очищен
echo ========================================
echo.
echo Что было сделано:
echo - Удалены node_modules из Git
echo - Удален .env из Git
echo - Добавлен .gitignore
echo.
echo Теперь в репозитории только нужные файлы!
echo.
pause
