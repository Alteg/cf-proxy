export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Эндпоинт проверки статуса
    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          status: "ok",
          worker: "cf-proxy",
          target: env.TARGET_BASE_URL || "https://httpbin.org",
        }),
        {
          headers: {
            "content-type": "application/json; charset=UTF-8",
          },
        }
      );
    }

    // Целевой базовый URL (настраивается через переменную TARGET_BASE_URL в Cloudflare)
    const targetBase = (env.TARGET_BASE_URL || "https://httpbin.org").replace(/\/+$/, "");
    const targetUrl = new URL(targetBase + url.pathname + url.search);

    // Копируем заголовки запроса и убираем служебные / hop-by-hop заголовки
    const newHeaders = new Headers(request.headers);
    newHeaders.delete("host");
    newHeaders.delete("cf-connecting-ip");
    newHeaders.delete("cf-ipcountry");
    newHeaders.delete("cf-ray");
    newHeaders.delete("cf-visitor");

    const newRequest = new Request(targetUrl.toString(), {
      method: request.method,
      headers: newHeaders,
      body: ["GET", "HEAD"].includes(request.method) ? null : request.body,
      redirect: "follow",
    });

    try {
      const response = await fetch(newRequest);
      return response;
    } catch (err) {
      return new Response(
        JSON.stringify({
          error: "Upstream error",
          message: err.message,
        }),
        {
          status: 502,
          headers: {
            "content-type": "application/json; charset=UTF-8",
          },
        }
      );
    }
  },
};
