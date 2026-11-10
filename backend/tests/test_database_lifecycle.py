from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
from unittest.mock import Mock

from app import database


def test_database_client_initialized_once_and_transport_closed_on_reset(monkeypatch):
    database.reset_supabase()
    clients = []
    transport = Mock()
    monkeypatch.setattr(database.httpx, 'Client', lambda **kwargs: transport)
    def create(*args, **kwargs):
        import time
        time.sleep(0.02)
        value = Mock()
        clients.append(value)
        return value
    monkeypatch.setattr(database, 'create_client', create)
    barrier = Barrier(4)
    def read(_):
        barrier.wait()
        return database.get_supabase()
    with ThreadPoolExecutor(max_workers=4) as workers:
        results = list(workers.map(read, range(4)))
    try:
        assert len(clients) == 1
        assert all(value is results[0] for value in results)
    finally:
        database.reset_supabase()
    transport.close.assert_called_once()
