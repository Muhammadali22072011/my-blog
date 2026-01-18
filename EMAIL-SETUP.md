# Настройка Email Рассылки

## Вариант 1: Resend + Supabase Edge Function (Рекомендуется)

### Шаг 1: Регистрация на Resend
1. Зайдите на https://resend.com
2. Зарегистрируйтесь (бесплатно до 3000 писем/месяц)
3. Получите API ключ

### Шаг 2: Создайте Supabase Edge Function

```bash
# В корне проекта
supabase functions new send-welcome-email
```

### Шаг 3: Код Edge Function

Создайте файл `supabase/functions/send-welcome-email/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  try {
    const { email } = await req.json()

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Your Blog <onboarding@resend.dev>',
        to: [email],
        subject: 'Welcome to My Blog Newsletter!',
        html: `
          <h1>Thanks for subscribing!</h1>
          <p>You'll receive updates about new posts.</p>
          <p>Unsubscribe anytime by clicking here.</p>
        `,
      }),
    })

    const data = await res.json()
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

### Шаг 4: Деплой функции

```bash
supabase functions deploy send-welcome-email --no-verify-jwt
supabase secrets set RESEND_API_KEY=your_resend_api_key
```

### Шаг 5: Обновите Newsletter.jsx

Добавьте вызов Edge Function после успешной подписки:

```javascript
// После успешной вставки в БД
await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-welcome-email`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
  },
  body: JSON.stringify({ email: email.toLowerCase() })
})
```

---

## Вариант 2: Database Trigger + Webhook

### Шаг 1: Создайте Database Trigger

```sql
CREATE OR REPLACE FUNCTION notify_new_subscriber()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_RESEND_API_KEY'
    ),
    body := jsonb_build_object(
      'from', 'Your Blog <onboarding@resend.dev>',
      'to', ARRAY[NEW.email],
      'subject', 'Welcome to Newsletter!',
      'html', '<h1>Thanks for subscribing!</h1>'
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_subscriber_created
  AFTER INSERT ON newsletter_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_subscriber();
```

---

## Вариант 3: Zapier/Make.com (Без кода)

1. Создайте Zap/Scenario
2. Trigger: Supabase - New Row in `newsletter_subscribers`
3. Action: Gmail/SendGrid - Send Email
4. Настройте шаблон письма

---

## Вариант 4: Простой Backend (Node.js)

Создайте простой API endpoint:

```javascript
// api/subscribe.js
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
  const { email } = req.body

  await resend.emails.send({
    from: 'Your Blog <onboarding@resend.dev>',
    to: email,
    subject: 'Welcome!',
    html: '<h1>Thanks for subscribing!</h1>'
  })

  res.json({ success: true })
}
```

---

## Рекомендация

Используйте **Вариант 1** (Resend + Edge Function) - это самый надежный и масштабируемый способ.

Бесплатный лимит Resend: 3000 писем/месяц
