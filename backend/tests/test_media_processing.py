from __future__ import annotations

import io
import base64

import pytest

from app.core.exceptions import ValidationError
from app.services.media_processing import process_avatar, process_memory_image


_TINY_PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
)


class ShortReadStream(io.BytesIO):
    def read(self, size: int = -1) -> bytes:
        return super().read(min(size, 7) if size >= 0 else 7)


def test_memory_processor_decodes_and_emits_private_ready_jpegs():
    result = process_memory_image(io.BytesIO(_TINY_PNG), max_bytes=1024)
    assert result.original.mime_type == "image/jpeg"
    assert result.original.content.startswith(b"\xff\xd8")
    assert result.original.width == 1
    assert result.original.height == 1
    assert result.thumbnail.content.startswith(b"\xff\xd8")
    assert result.thumbnail.width == 1
    assert result.thumbnail.height == 1


def test_avatar_processor_center_crops_to_a_square_without_upscaling():
    result = process_avatar(io.BytesIO(_TINY_PNG), max_bytes=1024)
    assert result.width == result.height == 1
    assert result.content.startswith(b"\xff\xd8")


def test_processor_rejects_non_images_and_reads_only_one_byte_past_limit():
    with pytest.raises(ValidationError, match="định dạng ảnh"):
        process_memory_image(io.BytesIO(b"not-an-image"), max_bytes=1024)
    with pytest.raises(ValidationError, match="kích thước"):
        process_memory_image(io.BytesIO(_TINY_PNG), max_bytes=len(_TINY_PNG) - 1)


def test_processor_handles_streams_that_return_short_reads():
    result = process_memory_image(ShortReadStream(_TINY_PNG), max_bytes=1024)
    assert result.original.width == result.original.height == 1
