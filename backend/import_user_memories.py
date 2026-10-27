"""Import the ten user-provided img photos through the real memory pipeline.

Run from backend with --emails EMAIL EMAIL --image-dir ../img.
Default is read-only preflight; --apply performs the explicitly requested import.
No accounts, sessions, remote images, or database schema are created.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from collections import Counter
from pathlib import Path

from fastapi import UploadFile

from app.config import settings
from app.database import get_supabase
from app.repositories.memory_repo import MemoryImageRepository, MemoryRepository
from app.schemas.memory import CreateMemoryRequest
from app.services.media_processing import process_memory_image
from app.services.memory_service import MemoryService


PHOTOS = (
    ("cà rốt.jpg", "2026-08-04", "moment"),
    ("cũng là ốc cô đơn.jpg", "2026-08-15", "moment"),
    ("lấu thới.jpg", "2026-08-27", "moment"),
    ("lủng lốp.jpg", "2026-09-06", "moment"),
    ("người đàn bà áo ren.jpg", "2026-09-17", "moment"),
    ("sinh nhật nốt.jpg", "2026-09-26", "milestone"),
    ("sinh nhật.jpg", "2026-10-02", "milestone"),
    ("tương tự.jpg", "2026-10-08", "moment"),
    ("tốt nghiệp.jpg", "2026-10-13", "milestone"),
    ("ốc cô đơn.jpg", "2026-10-18", "moment"),
)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--emails", nargs=2, required=True)
    parser.add_argument("--image-dir", type=Path, required=True)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    directory = args.image_dir.resolve(strict=True)
    if not directory.is_dir() or len(set(args.emails)) != 2:
        raise ValueError("Provide an image directory and two distinct existing accounts")

    prepared = []
    for name, day, category in PHOTOS:
        path = (directory / name).resolve(strict=True)
        if path.parent != directory:
            raise ValueError("Photo must belong to the explicitly selected directory")
        with path.open("rb") as source:
            process_memory_image(source, max_bytes=settings.max_upload_size_mb * 1024 * 1024)
        digest = hashlib.sha256(name.encode("utf-8") + path.read_bytes()).hexdigest()[:24]
        payload = CreateMemoryRequest(title=path.stem[:1].upper() + path.stem[1:], category=category, memory_date=day)
        prepared.append((path, payload, f"user-import-20261018-{digest}"))

    db = get_supabase()
    users = db.table("users").select("id,email,couple_id").in_("email", args.emails).execute().data
    if len(users) != 2 or {user["email"] for user in users} != set(args.emails):
        raise ValueError("Both exact accounts must already exist")
    by_email = {user["email"]: user for user in users}
    users = [by_email[email] for email in args.emails]
    couple_id = users[0]["couple_id"]
    if not couple_id or users[1]["couple_id"] != couple_id:
        raise ValueError("The two accounts must already belong to the same couple")
    couple = db.table("couples").select("id,partner1_id,partner2_id,status").eq("id", couple_id).single().execute().data
    if couple["status"] != "active" or {couple["partner1_id"], couple["partner2_id"]} != {user["id"] for user in users}:
        raise ValueError("Couple membership verification failed")

    months = dict(sorted(Counter(payload.memory_date[:7] for _, payload, _ in prepared).items()))
    print(json.dumps({"preflight": "passed", "photos": len(prepared), "months": months, "apply": args.apply}), flush=True)
    if not args.apply:
        return

    service = MemoryService(db, MemoryRepository(db), MemoryImageRepository(db))
    imported = []
    for index, (path, payload, key) in enumerate(prepared):
        user = users[index % len(users)]
        current = db.table("users").select("couple_id").eq("id", user["id"]).single().execute().data
        if current["couple_id"] != couple_id:
            raise ValueError("Membership changed; stopped before the next write")
        memory = service.create_memory(user["id"], couple_id, payload, request_key=key)
        with path.open("rb") as source:
            image = service.upload_image(user["id"], couple_id, memory.id, UploadFile(file=source, filename=path.name), request_key=key)
        imported.append((memory.id, image.id))
        print(json.dumps({"completed": index + 1, "memory_id": memory.id, "image_id": image.id}), flush=True)

    records = db.table("memories").select("id,memory_date,couple_id").in_("id", [memory_id for memory_id, _ in imported]).execute().data
    images = db.table("memory_images").select("id,memory_id").in_("id", [image_id for _, image_id in imported]).execute().data
    if len(records) != 10 or len(images) != 10 or any(record["couple_id"] != couple_id for record in records):
        raise RuntimeError("Final import verification failed")
    if {image["memory_id"] for image in images} != {record["id"] for record in records}:
        raise RuntimeError("Image ownership verification failed")
    print(json.dumps({"verified_memories": len(records), "verified_images": len(images), "months": dict(sorted(Counter(record["memory_date"][:7] for record in records).items()))}), flush=True)


if __name__ == "__main__":
    main()
