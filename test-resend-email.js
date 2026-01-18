// Тестовый скрипт для проверки отправки email через Resend
const RESEND_API_KEY = 're_FrKiarb5_JcEn936WA2ZMPjtLBdTmdamL';
const BLOG_NAME = 'Muhammadali Izzatullaev Blog';
const BLOG_URL = 'http://localhost:5173';

async function testEmail() {
  console.log('🚀 Отправка тестового письма...');
  
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: 'demoakkaunt00001@gmail.com',
        subject: `Добро пожаловать в ${BLOG_NAME}! 🎉`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #3b82f6; margin: 0; font-size: 32px;">${BLOG_NAME}</h1>
              <div style="width: 60px; height: 4px; background: linear-gradient(to right, #3b82f6, #8b5cf6); margin: 15px auto;"></div>
            </div>
            
            <h2 style="color: #333; font-size: 24px; margin-bottom: 20px;">Спасибо за подписку! 🎉</h2>
            
            <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">
              Привет! Спасибо, что подписались на наш блог.
            </p>
            
            <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 30px;">
              Теперь вы будете получать уведомления о новых статьях, обновлениях и интересных материалах прямо на вашу почту.
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${BLOG_URL}" 
                 style="background: linear-gradient(to right, #3b82f6, #8b5cf6); 
                        color: white; 
                        padding: 14px 32px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        display: inline-block;
                        font-weight: 600;
                        font-size: 16px;">
                Перейти в блог →
              </a>
            </div>
            
            <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 14px; color: #888; margin: 0;">
                С уважением,<br>
                <strong style="color: #3b82f6;">Команда ${BLOG_NAME}</strong>
              </p>
            </div>
            
            <div style="margin-top: 30px; text-align: center;">
              <p style="font-size: 12px; color: #999;">
                Вы получили это письмо, потому что подписались на рассылку ${BLOG_NAME}
              </p>
            </div>
          </div>
        `
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Ошибка:', error);
      return;
    }

    const data = await response.json();
    console.log('✅ Письмо успешно отправлено!');
    console.log('📧 ID письма:', data.id);
    console.log('📬 Проверьте почту demoakkaunt00001@gmail.com');
    console.log('');
    console.log('📝 Письмо содержит:');
    console.log(`   - Название блога: ${BLOG_NAME}`);
    console.log(`   - Красивый дизайн с градиентами`);
    console.log(`   - Кнопку для перехода в блог`);
  } catch (error) {
    console.error('❌ Ошибка при отправке:', error.message);
  }
}

testEmail();
