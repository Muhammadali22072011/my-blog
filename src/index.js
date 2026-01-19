export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Получаем ответ от статических файлов
    const response = await env.ASSETS.fetch(request);
    
    // SPA fallback: если файл не найден и это не запрос к файлу (без расширения)
    // возвращаем index.html для обработки роутинга на клиенте
    if (response.status === 404 && !url.pathname.includes('.')) {
      return env.ASSETS.fetch(new URL('/index.html', request.url));
    }
    
    return response;
  }
};
