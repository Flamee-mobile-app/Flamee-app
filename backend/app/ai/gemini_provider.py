"""Google Gemini provider (REST)."""
from __future__ import annotations

import asyncio

import httpx

from app.ai.base import AIProvider
from app.config import settings


class GeminiProvider(AIProvider):
    """Provider dùng Google Gemini Generative Language API.

    Tài liệu: https://ai.google.dev/api/generate-content
    Endpoint: {base}/v1beta/models/{model}:generateContent
    """

    def __init__(self) -> None:
        self._api_key = settings.gemini_api_key
        self._model = settings.gemini_model
        self._timeout = float(settings.ai_timeout_seconds)
        self._base_url = settings.gemini_base_url.rstrip("/")
        self._endpoint = (
            f"{self._base_url}/v1beta/models/{self._model}:generateContent"
        )

    @property
    def provider_name(self) -> str:
        return "gemini"

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    def _headers(self) -> dict[str, str]:
        return {
            "x-goog-api-key": self._api_key,
            "Content-Type": "application/json",
        }

    def _build_body(
        self, system: str, user: str, json_mode: bool
    ) -> dict:
        body: dict = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": f"{system}\n\n{user}"}],
                }
            ],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 1024,
            },
        }
        if json_mode:
            body["generationConfig"]["responseMimeType"] = "application/json"
        return body

    def _extract_text(self, data: dict) -> str:
        try:
            candidates = data["candidates"]
            return candidates[0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError, TypeError) as exc:
            raise RuntimeError(f"Unexpected Gemini response shape: {data}") from exc

    # ------------------------------------------------------------------
    # Public interface
    # ------------------------------------------------------------------
    async def _async_chat(self, body: dict) -> str:
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            resp = await client.post(
                self._endpoint, headers=self._headers(), json=body
            )
            resp.raise_for_status()
            data = resp.json()
        return self._extract_text(data)

    async def chat(self, system: str, user: str, *, json_mode: bool = False) -> str:
        body = self._build_body(system, user, json_mode)
        return await self._async_chat(body)

    def chat_sync(self, system: str, user: str, *, json_mode: bool = False) -> str:
        body = self._build_body(system, user, json_mode)
        return asyncio.run(self._async_chat(body))