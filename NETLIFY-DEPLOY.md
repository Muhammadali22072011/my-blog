# 🚀 Деплой на Netlify

## Быстрый старт

### 1. Через веб-интерфейс (Рекомендуется)

1. Зайди на https://app.netlify.com/
2. Нажми "Add new site" → "Import an existing project"
3. Выбери GitHub → `Muhammadali22072011/my-blog`
4. Настройки билда (автоматически из netlify.toml):
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Добавь Environment Variables:
   ```
   VITE_SUPABASE_URL = https://rfppkhwqnlkpjemmoexg.supabase.co
   VITE_SUPABASE_ANON_KEY = твой_ключ
   ```
6. Deploy!

### 2. Через CLI

```bash
# Логин
netlify login

# Инициализация
netlify init

# Деплой
netlify deploy --prod
```

## Преимущества Netlify

✅ 300 минут билда в месяц (vs 100 деплоев Vercel)
✅ Автоматический деплой из GitHub
✅ Бесплатный SSL
✅ Быстрый CDN
✅ Serverless функции
✅ Custom domain

## После деплоя

1. Получишь URL типа: `https://your-site.netlify.app`
2. Можно добавить custom domain: `izzatullaev.uz`
3. Автоматические деплои при каждом push в main

## Troubleshooting

Если билд падает:
- Проверь что все пакеты установлены в package.json
- Проверь переменные окружения
- Посмотри логи билда в Netlify Dashboard
