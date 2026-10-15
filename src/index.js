// === Класс Durable Object ===
// Именно он будет выполнять запросы к Gemini API из США
export class GeminiProxyDO {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const targetUrl = this.env.TARGET_BASE_URL + url.pathname + url.search;

    // Копируем заголовки из оригинального запроса
    const headers = new Headers(request.headers);
    
    // Убираем заголовки, которые могут помешать
    headers.delete('host');
    headers.delete('cf-connecting-ip');
    headers.delete('cf-ipcountry');
    headers.delete('cf-ray');
    headers.delete('cf-visitor');
    headers.delete('x-forwarded-proto');
    headers.delete('x-real-ip');

    // Создаём новый запрос к Gemini API
    const newRequest = new Request(targetUrl, {
      method: request.method,
      headers: headers,
      body: request.body,
      redirect: 'follow'
    });

    // Отправляем запрос
    const response = await fetch(newRequest);

    // Возвращаем ответ, копируя заголовки
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  }
}

// === Основной Worker ===
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Эндпоинт для проверки здоровья (не через DO)
    if (url.pathname === '/health') {
      return new Response('OK', { status: 200 });
    }

    // Получаем или создаём Durable Object с location hint "wnam"
    // Важно: idFromName гарантирует, что для одного и того же имени
    // будет использоваться один и тот же DO (и, следовательно, одно и то же местоположение)
    const id = env.GEMINI_PROXY_DO.idFromName('us-gemini-proxy');
    
    // Получаем "заглушку" (stub) для взаимодействия с DO
    // locationHint указывается только при первом вызове get() для данного ID
    const stub = env.GEMINI_PROXY_DO.get(id, { locationHint: 'wnam' });

    // Перенаправляем запрос в Durable Object
    return stub.fetch(request);
  }
};

