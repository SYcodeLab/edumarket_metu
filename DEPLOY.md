# 🚀 EduMarket МИТУ — Деплой на бесплатный хостинг

## Стек деплоя
- **Backend**: Render.com (бесплатный tier — Node.js)
- **Database**: FreeSQLDatabase.com (бесплатный MySQL)
- **Frontend**: Vercel.com (бесплатный — React/Vite)

---

## Шаг 1 — Бесплатная MySQL база (FreeSQLDatabase.com)

1. Зайди на https://www.freesqldatabase.com/
2. Зарегистрируйся (email + пароль)
3. Нажми "Create MySQL Database"
4. Сохрани данные подключения:
   ```
   Host:     sql1234.freesqldatabase.com
   Database: sql1234
   Username: sql1234
   Password: xxxxxxxx
   Port:     3306
   ```

---

## Шаг 2 — Загрузи код на GitHub

```bash
# В папке проекта
git init
git add .
git commit -m "EduMarket МИТУ v2.0"
git remote add origin https://github.com/ВАШ_USERNAME/edumarket-mitu.git
git push -u origin main
```

---

## Шаг 3 — Деплой Backend на Render.com

1. Зайди на https://render.com → Sign Up (через GitHub)
2. New → Web Service → Connect to GitHub → выбери репо
3. Настройки:
   ```
   Name:          edumarket-mitu-api
   Region:        Frankfurt (EU)
   Branch:        main
   Root Directory: backend
   Build Command: npm install
   Start Command: npm start
   Plan:          Free
   ```
4. Нажми **"Advanced"** → **Add Environment Variables**:
   ```
   NODE_ENV     = production
   DB_HOST      = sql1234.freesqldatabase.com  ← из FreeSQLDatabase
   DB_PORT      = 3306
   DB_NAME      = sql1234
   DB_USER      = sql1234
   DB_PASSWORD  = xxxxxxxx
   DB_SSL       = true
   JWT_SECRET   = (нажми "Generate" или введи длинную строку)
   CORS_ORIGIN  = https://edumarket-mitu.vercel.app  ← добавишь после деплоя фронтенда
   ```
5. Create Web Service

6. Подожди 2-3 минуты, затем открой:
   ```
   https://edumarket-mitu-api.onrender.com/health
   ```
   Должно вернуть: `{"status":"ok","env":"production"}`

### Создай таблицы в облаке:
После деплоя в Render → Shell:
```bash
node db/init.js
node db/seed.js  # добавит тестовые данные
```

---

## Шаг 4 — Деплой Frontend на Vercel

1. Зайди на https://vercel.com → Sign Up (через GitHub)
2. New Project → Import → выбери репо
3. Настройки:
   ```
   Framework:      Vite
   Root Directory: frontend
   Build Command:  npm run build
   Output Dir:     dist
   ```
4. Environment Variables:
   ```
   VITE_API_URL = https://edumarket-mitu-api.onrender.com/api
   ```
5. Deploy

6. После деплоя скопируй URL (например `https://edumarket-mitu.vercel.app`)
7. Вернись в Render → Environment → обнови `CORS_ORIGIN` на этот URL

---

## Шаг 5 — Проверь что всё работает

1. Открой `https://edumarket-mitu.vercel.app`
2. Зарегистрируйся через форму
3. Или войди с тестовым аккаунтом:
   - 💼 kaspi@company.kz / 123456
   - 🎓 aydar@student.kz / 123456
   - 🏫 admin@mitu.edu.kz / 123456

---

## ⚠ Важные нюансы

### Render Free tier:
- Сервис **"засыпает"** после 15 минут бездействия
- Первый запрос после сна — 30-60 секунд задержка (cold start)
- Для диплома/презентации — просто заранее зайди на `/health`

### FreeSQLDatabase:
- Лимит: 5MB данных (для MVP хватит)
- Соединений: ограничено
- Если нужно больше — используй **PlanetScale** (free tier 5GB)

### Альтернативы БД:
- **PlanetScale**: https://planetscale.com (MySQL, 5GB бесплатно)
- **Aiven**: https://aiven.io (MySQL, 1 месяц бесплатно)
- **Railway**: https://railway.app ($5 кредит, MySQL встроен)

---

## Локальный запуск (для разработки)

```
# Терминал 1
cd backend
npm install
npm run db:init
npm run db:seed   # тестовые данные
npm run dev       # :5000

# Терминал 2
cd frontend
npm install
npm run dev       # :3000
```

---

## Страницы и функции

| URL | Описание | Новое в v2 |
|-----|----------|------------|
| / | Главная | ✅ Реальные проекты |
| /catalog | Биржа | ✅ Пагинация, сортировка |
| /projects/:id | Страница проекта | 🆕 |
| /internships | Стажировки | |
| /companies | Компании | 🆕 |
| /users/:id | Профиль пользователя | 🆕 |
| /messages | Чат | 🆕 |
| /messages/:userId | Диалог | 🆕 |
| /favorites | Избранное | 🆕 |
| /edit-profile | Редактировать профиль | 🆕 |
| /dashboard | Дашборд | |
| /applications | Отклики | |
| /contracts | Договоры | |
| /analytics | Аналитика | |
| /notifications | Уведомления | |
| /reviews | Оценки | |
| /profile | Мой профиль | |
