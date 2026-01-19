export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Получаем ответ от статических файлов
    const response = await env.ASSETS.fetch(request);
    
    // SPA fallback: если 404 и это не файл со статическим расширением
    if (response.status === 404) {
      const ext = url.pathname.split('.').pop();
      const staticExtensions = ['js', 'css', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'woff', 'woff2', 'ttf', 'eot', 'json', 'xml', 'txt', 'webmanifest'];
      
      // Если это не статический файл - возвращаем index.html для SPA роутинга
      if (!staticExtensions.includes(ext) || !url.pathname.includes('.')) {
        return env.ASSETS.fetch(new URL('/index.html', request.url));
      }
    }
    
    return response;
  }
};
