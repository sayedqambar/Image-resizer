from app import config
from app.services import background as background_service

FAKE_PNG = b"\x89PNG\r\n\x1a\nfake-transparent-output"


def test_remove_background_ok(client, sample_png, monkeypatch):
    monkeypatch.setattr(background_service, "remove_background", lambda data: FAKE_PNG)
    r = client.post(
        "/remove-background",
        files={"file": ("a.png", sample_png, "image/png")},
    )
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("image/png")
    assert r.content == FAKE_PNG


def test_remove_background_missing_file(client):
    r = client.post("/remove-background")
    assert r.status_code == 422


def test_remove_background_wrong_type(client):
    r = client.post(
        "/remove-background",
        files={"file": ("a.txt", b"hello", "text/plain")},
    )
    assert r.status_code == 415


def test_remove_background_too_large(client, sample_png, monkeypatch):
    monkeypatch.setattr(config, "MAX_UPLOAD_BYTES", 5)
    r = client.post(
        "/remove-background",
        files={"file": ("a.png", sample_png, "image/png")},
    )
    assert r.status_code == 413


def test_remove_background_service_error(client, sample_png, monkeypatch):
    def _raise(data):
        raise RuntimeError("model failed")

    monkeypatch.setattr(background_service, "remove_background", _raise)
    r = client.post(
        "/remove-background",
        files={"file": ("a.png", sample_png, "image/png")},
    )
    assert r.status_code == 500
    assert "model failed" in r.json()["detail"]
