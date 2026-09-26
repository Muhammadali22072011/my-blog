// Vercel Function: честный 404 для /.well-known/*.
//
// Без неё любой неизвестный адрес уходил на index.html с кодом 200.
// Коннектор claude.ai перед подключением к /mcp проверяет
// /.well-known/oauth-protected-resource и oauth-authorization-server:
// получив 200, он решал, что у сервера есть OAuth, пытался
// зарегистрироваться и падал с «Couldn't register … sign-in service».
// MCP здесь защищён ключом в адресе, OAuth нет — так и отвечаем.

export const config = { runtime: 'edge' }

export default function handler() {
  return new Response(JSON.stringify({ error: 'not_found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
  })
}
