export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // отдать статические файлы
    const res = await env.ASSETS.fetch(request);
    
    // SPA fallback: все "не-файлы" -> index.html
    if (res.status === 404 && !url.pathname.includes(".")) {
      return env.ASSETS.fetch(new URL("/index.html", request.url));
    }
    
    return res;
  }
};
