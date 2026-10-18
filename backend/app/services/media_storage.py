from __future__ import annotations

from typing import Any, Iterable


MEDIA_BUCKET = "flamee-media"
SIGNED_URL_TTL_SECONDS = 900


class MediaStorage:
    """Small server-only gateway around the private Supabase media bucket."""

    def __init__(self, db: Any) -> None:
        self.bucket = db.storage.from_(MEDIA_BUCKET)

    def upload(
        self, path: str, content: bytes, mime_type: str = "image/jpeg"
    ) -> None:
        self.bucket.upload(
            path=path,
            file=content,
            file_options={"content-type": mime_type, "upsert": "false"},
        )

    def remove(self, paths: Iterable[str | None]) -> None:
        present = [path for path in paths if isinstance(path, str) and path]
        if present:
            self.bucket.remove(present)

    def sign(
        self, path: str, expires_in: int = SIGNED_URL_TTL_SECONDS
    ) -> str:
        response = self.bucket.create_signed_url(path, expires_in)
        if isinstance(response, dict):
            url = (
                response.get("signedURL")
                or response.get("signedUrl")
                or response.get("signed_url")
            )
        else:
            url = getattr(response, "signed_url", None)
        if not isinstance(url, str) or not url:
            raise RuntimeError("Supabase did not return a signed URL")
        return url

    def sign_many(
        self,
        paths: Iterable[str | None],
        expires_in: int = SIGNED_URL_TTL_SECONDS,
    ) -> dict[str, str]:
        unique = list(
            dict.fromkeys(path for path in paths if isinstance(path, str) and path)
        )
        if not unique:
            return {}
        response = self.bucket.create_signed_urls(unique, expires_in)
        signed: dict[str, str] = {}
        for item in response:
            if not isinstance(item, dict):
                continue
            path = item.get("path")
            url = item.get("signedURL") or item.get("signedUrl")
            if isinstance(path, str) and isinstance(url, str) and url:
                signed[path] = url
        missing = [path for path in unique if path not in signed]
        if missing:
            raise RuntimeError("Supabase did not return signed URLs for all media")
        return signed
