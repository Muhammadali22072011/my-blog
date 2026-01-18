# 🔧 Исправление ошибки "Missing Supabase environment variables"

## Проблема
```
Missing Supabase environment variables. Please check your .env.local file.
supabaseUrl is required.
```

## ✅ Решение - Добавить переменные в Vercel

### Шаг 1: Откройте настройки проекта на Vercel

1. Зайдите на https://vercel.com/dashboard
2. Найдите проект **my-blog**
3. Нажмите на него
4. Нажмите **Settings** (вверху)

### Шаг 2: Добавьте Environment Variables

1. В левом меню нажмите **Environment Variables**
2. Нажмите кнопку **Add New** (или **Add Variable**)

### Шаг 3: Добавьте 3 переменные

#### Переменная 1: VITE_SUPABASE_URL

```
Key: VITE_SUPABASE_URL
Value: https://rfppkhwqnlkpjemmoexg.supabase.co
```

**Важно:** Отметьте все 3 галочки:
- ✅ Production
- ✅ Preview  
- ✅ Development

Нажмите **Save**

---

#### Переменная 2: VITE_SUPABASE_ANON_KEY

```
Key: VITE_SUPABASE_ANON_KEY
Value: sb_publishable_K0nbMg7IIokoaMTP5UkFxg_QM_-o4S0
```

**Важно:** Отметьте все 3 галочки:
- ✅ Production
- ✅ Preview
- ✅ Development

Нажмите **Save**

---

#### Переменная 3: VITE_ADMIN_EMAIL

```
Key: VITE_ADMIN_EMAIL
Value: cursordemo32@gmail.com
```

**Важно:** Отметьте все 3 галочки:
- ✅ Production
- ✅ Preview
- ✅ Development

Нажмите **Save**

---

### Шаг 4: Redeploy проекта

**Это самый важный шаг!** Переменные применяются только после redeploy.

1. Вернитесь на вкладку **Deployments** (вверху)
2. Найдите последний деплой (самый верхний)
3. Нажмите три точки **...** справа
4. Выберите **Redeploy**
5. В появившемся окне нажмите **Redeploy** еще раз

### Шаг 5: Подождите 1-2 минуты

Vercel пересоберет проект с новыми переменными.

---

## 🔍 Как проверить что переменные добавлены правильно

После добавления переменных, вы должны видеть их в списке:

```
VITE_SUPABASE_URL          https://rfppkhwqnlkpjemmoexg.supabase.co    Production, Preview, Development
VITE_SUPABASE_ANON_KEY     sb_publishable_K0nbMg7IIokoaMTP5UkFxg...    Production, Preview, Development  
VITE_ADMIN_EMAIL           cursordemo32@gmail.com                      Production, Preview, Development
```

---

## ⚠️ Частые ошибки

### Ошибка 1: Забыли отметить галочки Environment
Убедитесь что отмечены **все 3 галочки**: Production, Preview, Development

### Ошибка 2: Забыли сделать Redeploy
Переменные применяются **только после Redeploy**! Просто добавить их недостаточно.

### Ошибка 3: Опечатка в названии переменной
Название должно быть **точно** как указано:
- `VITE_SUPABASE_URL` (не `SUPABASE_URL`)
- `VITE_SUPABASE_ANON_KEY` (не `SUPABASE_ANON_KEY`)
- `VITE_ADMIN_EMAIL` (не `ADMIN_EMAIL`)

### Ошибка 4: Использовали Secret key вместо Publishable key
Для `VITE_SUPABASE_ANON_KEY` используйте **Publishable key** (начинается с `sb_publishable_`), а НЕ Secret key!

---

## ✅ После успешного деплоя

Откройте ваш сайт и проверьте консоль браузера (F12):
- ❌ Если видите ошибку "Missing Supabase environment variables" - переменные не применились
- ✅ Если ошибки нет - всё работает!

---

## 📸 Скриншот правильных настроек

В Vercel Settings → Environment Variables должно быть так:

```
┌─────────────────────────────┬──────────────────────────────────────┬────────────────────────────────┐
│ Key                         │ Value                                │ Environment                    │
├─────────────────────────────┼──────────────────────────────────────┼────────────────────────────────┤
│ VITE_SUPABASE_URL          │ https://rfppkhwqnlkpjemmoexg...      │ Production, Preview, Dev       │
│ VITE_SUPABASE_ANON_KEY     │ sb_publishable_K0nbMg7IIoko...       │ Production, Preview, Dev       │
│ VITE_ADMIN_EMAIL           │ cursordemo32@gmail.com               │ Production, Preview, Dev       │
└─────────────────────────────┴──────────────────────────────────────┴────────────────────────────────┘
```

---

## 🆘 Всё еще не работает?

Проверьте:
1. Все 3 переменные добавлены
2. Названия переменных написаны правильно (с префиксом `VITE_`)
3. Отмечены все 3 галочки Environment
4. Вы сделали **Redeploy** после добавления переменных
5. Подождали 1-2 минуты после redeploy

Если всё равно не работает - напиши мне, разберемся! 🚀
