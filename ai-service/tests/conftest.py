"""Shared fixtures for the AI service tests."""
import io

import numpy as np
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from main import app


@pytest.fixture()
def client():
    return TestClient(app)


def _png_bytes(color: tuple[int, int, int]) -> bytes:
    """A small solid-color PNG (used as a stand-in upload)."""
    arr = np.zeros((64, 64, 3), dtype=np.uint8)
    arr[:, :] = color
    buf = io.BytesIO()
    Image.fromarray(arr).save(buf, format="PNG")
    return buf.getvalue()


@pytest.fixture()
def sample_png() -> bytes:
    return _png_bytes((0, 200, 0))


@pytest.fixture()
def sample_jpeg() -> bytes:
    arr = np.zeros((64, 64, 3), dtype=np.uint8)
    arr[:, :] = (200, 0, 0)
    buf = io.BytesIO()
    Image.fromarray(arr).save(buf, format="JPEG")
    return buf.getvalue()
