-- Исправление таблицы comments
-- Выполните в Supabase SQL Editor

-- Добавляем колонку approved если её нет
ALTER TABLE comments ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT true;

-- Обновляем существующие комментарии
UPDATE comments SET approved = true WHERE approved IS NULL;

-- Готово!
