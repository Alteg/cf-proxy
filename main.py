import os
from contextlib import asynccontextmanager
from typing import AsyncIterator

import httpx
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, Response, StreamingResponse

TARGET_BASE_URL = os.getenv("TARGET_BASE_URL", "https://httpbin.org").rstrip("/")

# Заголовки, которые не следует пересылать напрямую
HOP_BY_HOP_HEADERS = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade",
    "host",
}

http_client: httpx.AsyncClient | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global http_client
    http_client = httpx.AsyncClient(
        timeout=httpx.Timeout(30.0, connect=10.0),
        follow_redirects=True,
    )
    try:
        yield
    finally:
        await http_client.aclose()


app = FastAPI(
    title="CF Proxy",
    description="Легковесный HTTP/HTTPS reverse-proxy на FastAPI и HTTPX",
    version="0.1.0",
    lifespan=lifespan,
)


@app.get("/health", tags=["system"])
async def health_check():
    return {
        "status": "ok",
        "target": TARGET_BASE_URL,
    }


def filter_headers(headers: dict[str, str]) -> dict[str, str]:
    return {
        key: value
        for key, value in headers.items()
        if key.lower() not in HOP_BY_HOP_HEADERS
    }


@app.api_route(
    "/{path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
)
async def proxy_handler(request: Request, path: str):
    if http_client is None:
        return JSONResponse(status_code=500, content={"error": "Client not initialized"})

    target_url = f"{TARGET_BASE_URL}/{path}"
    if request.url.query:
        target_url = f"{target_url}?{request.url.query}"

    forwarded_headers = filter_headers(dict(request.headers))

    # Стриминг тела запроса от клиента
    body = await request.body()

    try:
        client_response = await http_client.send(
            http_client.build_request(
                method=request.method,
                url=target_url,
                headers=forwarded_headers,
                content=body if body else None,
            ),
            stream=True,
        )

        response_headers = filter_headers(dict(client_response.headers))

        async def stream_content() -> AsyncIterator[bytes]:
            async for chunk in client_response.aiter_bytes():
                yield chunk
            await client_response.aclose()

        return StreamingResponse(
            stream_content(),
            status_code=client_response.status_code,
            headers=response_headers,
            media_type=client_response.headers.get("content-type"),
        )
    except httpx.RequestError as exc:
        return JSONResponse(
            status_code=502,
            content={"error": "Proxy upstream error", "details": str(exc)},
        )


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host=host, port=port, reload=True)
