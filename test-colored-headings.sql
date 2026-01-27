-- Тестовый пост с цветными заголовками
INSERT INTO posts (content, status, category, created_at, updated_at)
VALUES (
'# 🎨 Тест цветных заголовков

## <span style="color: #3b82f6; font-weight: bold">🔵 Синий заголовок</span>

Это обычный текст под синим заголовком.

## <span style="color: #ef4444; font-weight: bold">🔴 Красный заголовок</span>

Это обычный текст под красным заголовком.

## <span style="color: #10b981; font-weight: bold">🟢 Зелёный заголовок</span>

Это обычный текст под зелёным заголовком.

## <span style="color: white; background: #ef4444; padding: 6px 12px; border-radius: 6px; font-weight: bold">⚠️ ВАЖНО</span> С фоном

Это заголовок с красным фоном.

## <span style="background: linear-gradient(to right, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: bold; font-size: 1.5em">✨ Градиентный заголовок</span>

Это заголовок с градиентом.

## <span style="animation: pulse 2s infinite; color: #ef4444; font-weight: bold">💓 Пульсирующий</span>

Это заголовок с анимацией пульсации.

## <span style="color: #00ff00; text-shadow: 0 0 10px #00ff00, 0 0 20px #00ff00; font-weight: bold">⚡ NEON</span>

Это неоновый заголовок.

## Обычный текст с <span style="color: #3b82f6">синим словом</span> внутри

Можно красить отдельные слова!

## <span style="background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%); color: #000; padding: 8px 16px; border-radius: 8px; font-weight: bold; box-shadow: 0 4px 12px rgba(255,215,0,0.4)">👑 PREMIUM</span>

Золотой премиум стиль.

---

Все эти стили должны работать! Если не работают - нужно подождать деплоя.',
'published',
'Tutorial',
NOW(),
NOW()
);

-- Проверяем что пост создался
SELECT id, SUBSTRING(content, 1, 50) as preview, status, created_at 
FROM posts 
WHERE content LIKE '%Тест цветных заголовков%'
ORDER BY created_at DESC 
LIMIT 1;
