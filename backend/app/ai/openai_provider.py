from __future__ import annotations

import json

import httpx

from app.ai.base import AIProvider
from app.config import settings


class OpenAIProvider(AIProvider):
    """AI provider using the OpenAI Chat Completions API."""

    def __init__(self) -> None:
        self._api_key = settings.openai_api_key
        self._model = settings.ai_chat_model
        self._timeout = settings.ai_timeout_seconds

    async def chat(self, system: str, user: str, *, json_mode: bool = False) -> str:
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }
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

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=body,
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]
