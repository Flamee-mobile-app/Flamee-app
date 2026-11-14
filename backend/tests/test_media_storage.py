from __future__ import annotations

from app.services.media_storage import MediaStorage


class RecordingBucket:
    def __init__(self) -> None:
        self.uploaded: list[tuple[str, bytes, dict]] = []
        self.removed: list[list[str]] = []
        self.batch_signed: list[tuple[list[str], int]] = []

    def upload(self, path, file, file_options):
        self.uploaded.append((path, file, file_options))

    def remove(self, paths):
        self.removed.append(paths)

    def create_signed_url(self, path, expires_in):
        return {"signedURL": f"https://private.test/{path}?ttl={expires_in}"}

    def create_signed_urls(self, paths, expires_in):
        self.batch_signed.append((list(paths), expires_in))
        return [
            {"path": path, "signedURL": f"https://private.test/{path}?ttl={expires_in}"}
            for path in paths
        ]


class RecordingStorage:
    def __init__(self) -> None:
        self.bucket = RecordingBucket()
        self.names: list[str] = []

    def from_(self, name):
        self.names.append(name)
        return self.bucket


class RecordingDb:
    def __init__(self) -> None:
        self.storage = RecordingStorage()


def test_storage_uses_private_bucket_and_never_generates_public_urls():
    db = RecordingDb()
    storage = MediaStorage(db)
    storage.upload("memories/couple/memory/file.jpg", b"jpeg", "image/jpeg")
    url = storage.sign("memories/couple/memory/file.jpg")
    storage.remove(["memories/couple/memory/file.jpg"])
    assert set(db.storage.names) == {"flamee-media"}
    assert db.storage.bucket.uploaded == [
        (
            "memories/couple/memory/file.jpg",
            b"jpeg",
            {"content-type": "image/jpeg", "upsert": "false"},
        )
    ]
    assert url == "https://private.test/memories/couple/memory/file.jpg?ttl=900"
    assert db.storage.bucket.removed == [["memories/couple/memory/file.jpg"]]


def test_storage_ignores_empty_cleanup_and_rejects_unexpected_signed_response():
    db = RecordingDb()
    storage = MediaStorage(db)
    storage.remove(["", None])
    assert db.storage.bucket.removed == []
    db.storage.bucket.create_signed_url = lambda *_args: {}
    try:
        storage.sign("avatars/user/avatar.jpg")
    except RuntimeError as error:
        assert "signed URL" in str(error)
    else:
        raise AssertionError("missing signed URL must fail closed")


def test_storage_signs_a_page_of_paths_in_one_batch():
    db = RecordingDb()
    storage = MediaStorage(db)
    signed = storage.sign_many(["one.jpg", "two.jpg", "one.jpg"])
    assert signed == {
        "one.jpg": "https://private.test/one.jpg?ttl=900",
        "two.jpg": "https://private.test/two.jpg?ttl=900",
    }
    assert db.storage.bucket.batch_signed == [(["one.jpg", "two.jpg"], 900)]
