from app.services import smartcrop as smartcrop_service

FAKE_PNG = b"\x89PNG\r\n\x1a\nfake-cropped-output"


def test_smart_crop_ok(client, sample_png, monkeypatch):
    captured = {}
    def _fake(data, aw, ah):
        captured["args"] = (aw, ah)
        return FAKE_PNG
    monkeypatch.setattr(smartcrop_service, "smart_crop", _fake)
    r = client.post(
        "/smart-crop",
        files={"file": ("a.png", sample_png, "image/png")},
        data={"aspect_w": "16", "aspect_h": "9"},
    )
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("image/png")
    assert r.content == FAKE_PNG
    assert captured["args"] == (16, 9)


def test_smart_crop_invalid_ratio(client, sample_png, monkeypatch):
    monkeypatch.setattr(smartcrop_service, "smart_crop", lambda *a, **k: FAKE_PNG)
    r = client.post(
        "/smart-crop",
        files={"file": ("a.png", sample_png, "image/png")},
        data={"aspect_w": "0", "aspect_h": "9"},
    )
    assert r.status_code == 400


def test_smart_crop_missing_ratio(client, sample_png):
    r = client.post(
        "/smart-crop",
        files={"file": ("a.png", sample_png, "image/png")},
    )
    assert r.status_code == 422
