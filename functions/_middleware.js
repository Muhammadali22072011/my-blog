export async function onRequest(context) {
  try {
    const url = new URL(context.request.url);
    
    // Пробуем получить статический файл
    const response = await context.next();
    
    // SPA fallback: если 404 и это не файл (нет точки в пути)
    if (response.status === 404 && !url.pathname.includes('.')) {
      // Возвращаем index.html для SPA роутинга
      const indexResponse = await fetch(new URL('/index.html', url.origin));
      return new Response(indexResponse.body, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          ...Object.fromEntries(indexResponse.headers)
        }
      });
    }
    
    return response;
  } catch (error) {
    // В случае ошибки возвращаем index.html
    const url = new URL(context.request.url);
    const indexResponse = await fetch(new URL('/index.html', url.origin));
    return new Response(indexResponse.body, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}
