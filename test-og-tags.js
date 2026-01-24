// Тест OG тегов для Telegram
// Запуск: node test-og-tags.js

const https = require('https');

const POST_ID = 98; // Измените на ID вашего поста
const BASE_URL = 'https://izzatullaev.uz'; // Измените на ваш домен

function testOGTags(postId) {
  const url = `${BASE_URL}/post/${postId}`;
  
  console.log('🔍 Проверка OG тегов для Telegram...');
  console.log('📍 URL:', url);
  console.log('');

  https.get(url, (res) => {
    let html = '';

    res.on('data', (chunk) => {
      html += chunk;
    });

    res.on('end', () => {
      console.log('✅ Страница загружена\n');

      // Извлекаем OG теги
      const ogTags = {
        'og:title': extractMeta(html, 'og:title'),
        'og:description': extractMeta(html, 'og:description'),
        'og:image': extractMeta(html, 'og:image'),
        'og:image:secure_url': extractMeta(html, 'og:image:secure_url'),
        'og:image:type': extractMeta(html, 'og:image:type'),
        'og:image:width': extractMeta(html, 'og:image:width'),
        'og:image:height': extractMeta(html, 'og:image:height'),
        'og:url': extractMeta(html, 'og:url'),
        'og:type': extractMeta(html, 'og:type'),
      };

      // Проверяем результаты
      console.log('📋 Найденные OG теги:\n');
      let hasErrors = false;

      for (const [tag, value] of Object.entries(ogTags)) {
        if (value) {
          console.log(`✅ ${tag}:`);
          console.log(`   ${value}`);
        } else {
          console.log(`❌ ${tag}: НЕ НАЙДЕН`);
          hasErrors = true;
        }
        console.log('');
      }

      // Проверка изображения
      if (ogTags['og:image']) {
        console.log('🖼️  Проверка изображения...');
        checkImage(ogTags['og:image']);
      } else {
        console.log('⚠️  ВНИМАНИЕ: OG изображение не найдено!');
        console.log('   Telegram не покажет превью картинки.');
      }

      // Итоговый результат
      console.log('\n' + '='.repeat(50));
      if (!hasErrors && ogTags['og:image']) {
        console.log('✅ ВСЁ ОТЛИЧНО! Telegram покажет превью.');
      } else {
        console.log('⚠️  ЕСТЬ ПРОБЛЕМЫ! Проверьте отсутствующие теги.');
        console.log('\n📖 Инструкция: см. файл TELEGRAM-ПРЕВЬЮ-БЫСТРО.md');
      }
      console.log('='.repeat(50));
    });

  }).on('error', (err) => {
    console.error('❌ Ошибка загрузки страницы:', err.message);
  });
}

function extractMeta(html, property) {
  const regex = new RegExp(`<meta\\s+property=["']${property}["']\\s+content=["']([^"']+)["']`, 'i');
  const match = html.match(regex);
  return match ? match[1] : null;
}

function checkImage(imageUrl) {
  const url = new URL(imageUrl);
  
  https.get(imageUrl, (res) => {
    if (res.statusCode === 200) {
      console.log(`   ✅ Изображение доступно (${res.statusCode})`);
      console.log(`   📦 Размер: ${res.headers['content-length']} байт`);
      console.log(`   📄 Тип: ${res.headers['content-type']}`);
    } else {
      console.log(`   ❌ Ошибка загрузки изображения (${res.statusCode})`);
    }
  }).on('error', (err) => {
    console.log(`   ❌ Изображение недоступно: ${err.message}`);
  });
}

// Запуск теста
testOGTags(POST_ID);
