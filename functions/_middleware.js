export async function onRequest(context) {
  const url = new URL(context.request.url);
  
  // Пробуем получить статический файл
  const response = await context.next();
  
  // SPA fallback: если 404 и это не файл (нет точки в пути)
  if (response.status === 404 && !url.pathname.includes('.')) {
    // Возвращаем index.html
    return context.env.ASSETS.fetch(new URL('/index.html', context.request.url));
  }
  
  return response;
}
