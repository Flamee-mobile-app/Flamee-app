"""Start the real ASGI server on loopback without database writes."""
from pathlib import Path
import socket
import subprocess
import sys
import time

import httpx


def test_uvicorn_startup_and_public_http_contract():
    with socket.socket() as listener:
        listener.bind(('127.0.0.1', 0))
        port = listener.getsockname()[1]
    process = subprocess.Popen(
        [sys.executable, '-B', '-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', str(port)],
        cwd=Path(__file__).resolve().parents[1],
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
    )
    try:
        with httpx.Client(base_url=f'http://127.0.0.1:{port}', timeout=2) as client:
            deadline = time.monotonic() + 15
            while True:
                assert process.poll() is None, 'Uvicorn exited during startup'
                try:
                    response = client.get('/health')
                    break
                except httpx.RequestError:
                    assert time.monotonic() < deadline, 'Uvicorn startup timed out'
                    time.sleep(0.1)
            assert response.status_code == 200
            assert response.json()['status'] == 'ok'
            assert client.get('/docs').status_code == 200
            schema = client.get('/openapi.json')
            assert schema.status_code == 200
            assert '/api/v1/auth/me/avatar' in schema.json()['paths']
            assert '/api/v1/auth/refresh' in schema.json()['paths']
            assert client.get('/api/v1/auth/me').status_code == 401
            assert client.get('/api/v1/memories').status_code == 401
    finally:
        process.terminate()
        try:
            process.communicate(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
            process.communicate(timeout=5)
