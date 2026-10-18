from __future__ import annotations

import io
import warnings
from dataclasses import dataclass
from typing import BinaryIO

from PIL import Image, ImageOps, UnidentifiedImageError

from app.core.exceptions import ValidationError


MAX_IMAGE_PIXELS = 20_000_000
MEMORY_MAX_EDGE = 1600
THUMBNAIL_MAX_EDGE = 480
AVATAR_EDGE = 512


@dataclass(frozen=True)
class EncodedImage:
    content: bytes
    width: int
    height: int
    mime_type: str = "image/jpeg"


@dataclass(frozen=True)
class ProcessedMemoryImage:
    original: EncodedImage
    thumbnail: EncodedImage


def _read_bounded(stream: BinaryIO, max_bytes: int) -> bytes:
    if max_bytes <= 0:
        raise ValidationError("Giới hạn kích thước ảnh không hợp lệ")
    chunks: list[bytes] = []
    remaining = max_bytes + 1
    while remaining > 0:
        chunk = stream.read(remaining)
        if not chunk:
            break
        chunks.append(chunk)
        remaining -= len(chunk)
    content = b"".join(chunks)
    if len(content) > max_bytes:
        raise ValidationError("Ảnh vượt quá giới hạn kích thước")
    return content


def _decode(stream: BinaryIO, max_bytes: int) -> Image.Image:
    content = _read_bounded(stream, max_bytes)
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            source = Image.open(io.BytesIO(content))
            width, height = source.size
            if width <= 0 or height <= 0 or width * height > MAX_IMAGE_PIXELS:
                raise ValidationError("Ảnh vượt quá giới hạn số pixel")
            if getattr(source, "n_frames", 1) != 1:
                raise ValidationError("Ảnh động không được hỗ trợ")
            source.load()
            oriented = ImageOps.exif_transpose(source)
            if oriented.mode in ("RGBA", "LA") or "transparency" in oriented.info:
                rgba = oriented.convert("RGBA")
                background = Image.new("RGB", rgba.size, "white")
                background.paste(rgba, mask=rgba.getchannel("A"))
                return background
            return oriented.convert("RGB")
    except ValidationError:
        raise
    except (
        UnidentifiedImageError,
        OSError,
        ValueError,
        Image.DecompressionBombError,
        Image.DecompressionBombWarning,
    ) as exc:
        raise ValidationError("File không phải định dạng ảnh hợp lệ") from exc


def _fit_within(image: Image.Image, max_edge: int) -> Image.Image:
    result = image.copy()
    result.thumbnail((max_edge, max_edge), Image.Resampling.LANCZOS)
    return result


def _encode(image: Image.Image, quality: int) -> EncodedImage:
    output = io.BytesIO()
    image.save(output, format="JPEG", quality=quality, optimize=True)
    return EncodedImage(
        content=output.getvalue(), width=image.width, height=image.height
    )


def process_memory_image(
    stream: BinaryIO, *, max_bytes: int
) -> ProcessedMemoryImage:
    decoded = _decode(stream, max_bytes)
    original = _fit_within(decoded, MEMORY_MAX_EDGE)
    thumbnail = _fit_within(decoded, THUMBNAIL_MAX_EDGE)
    return ProcessedMemoryImage(
        original=_encode(original, quality=88),
        thumbnail=_encode(thumbnail, quality=82),
    )


def process_avatar(stream: BinaryIO, *, max_bytes: int) -> EncodedImage:
    decoded = _decode(stream, max_bytes)
    edge = min(AVATAR_EDGE, decoded.width, decoded.height)
    square = ImageOps.fit(
        decoded, (edge, edge), method=Image.Resampling.LANCZOS, centering=(0.5, 0.5)
    )
    return _encode(square, quality=88)
