from app.services import upscale as upscale_service

FAKE_PNG = b"\x89PNG\r\n\x1a\nfake-upscaled-output"


def test_upscale_ok(client, sample_png, monkeypatch):
    monkeypatch.setattr(upscale_service, "upscale", lambda data, scale: FAKE_PNG)
    r = client.post(
        "/upscale",
        files={"file": ("a.png", sample_png, "image/png")},
        data={"scale": "2"},
    )
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("image/png")
    assert r.content == FAKE_PNG


def test_upscale_4x(client, sample_png, monkeypatch):
    captured = {}
    def _fake(data, scale):
        captured["scale"] = scale
        return FAKE_PNG
    monkeypatch.setattr(upscale_service, "upscale", _fake)
    r = client.post(
        "/upscale",
        files={"file": ("a.png", sample_png, "image/png")},
        data={"scale": "4"},
    )
    assert r.status_code == 200
    assert captured["scale"] == 4


def test_upscale_invalid_scale(client, sample_png, monkeypatch):
    monkeypatch.setattr(upscale_service, "upscale", lambda *a, **k: FAKE_PNG)
    r = client.post(
        "/upscale",
        files={"file": ("a.png", sample_png, "image/png")},
        data={"scale": "3"},
    )
    assert r.status_code == 400


def test_upscale_missing_scale(client, sample_png):
    r = client.post(
        "/upscale",
        files={"file": ("a.png", sample_png, "image/png")},
    )
    assert r.status_code == 422
