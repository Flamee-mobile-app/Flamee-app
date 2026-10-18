"""OpenAI Chat Completions provider."""
from __future__ import annotations

import asyncio
import json

import httpx

from app.ai.base import AIProvider
from app.config import settings


class OpenAIProvider(AIProvider):
    """Provider dùng OpenAI Chat Completions API (REST thuần)."""

    def __init__(self) -> None:
        self._api_key = settings.openai_api_key
        self._model = settings.ai_chat_model
        self._timeout = float(settings.ai_timeout_seconds)
        self._base_url = settings.openai_base_url.rstrip("/")
        self._endpoint = f"{self._base_url}/chat/completions"

    @property
    def provider_name(self) -> str:
        return "openai"

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }

    def _build_body(self, system: str, user: str, json_mode: bool) -> dict:
        body: dict = {
            "model": self._model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "max_tokens": 1024,
        }
        if json_mode:
            body["response_format"] = {"type": "json_object"}
        return body

    def _post(self, body: dict) -> dict:
        with httpx.Client(timeout=self._timeout) as client:
            resp = client.post(self._endpoint, headers=self._headers(), json=body)
            resp.raise_for_status()
            return resp.json()

    async def chat(self, system: str, user: str, *, json_mode: bool = False) -> str:
        body = self._build_body(system, user, json_mode)
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            resp = await client.post(
                self._endpoint, headers=self._headers(), json=body
            )
            resp.raise_for_status()
            data = resp.json()
        return data["choices"][0]["message"]["content"]

    def chat_sync(self, system: str, user: str, *, json_mode: bool = False) -> str:
        body = self._build_body(system, user, json_mode)
        return asyncio.run(self._async_chat(body))

    async def _async_chat(self, body: dict) -> str:
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            resp = await client.post(
                self._endpoint, headers=self._headers(), json=body
            )
            resp.raise_for_status()
            data = resp.json()
        return data["choices"][0]["message"]["content"]