"""Subject-aware cropping.

Detects the main face with the OpenCV Haar cascade (ships with the opencv wheel,
so no model download needed) and crops to a requested width:height aspect ratio,
keeping the subject centered. When no face is found it falls back to a centered
crop. OpenCV and NumPy are imported lazily.
"""
from __future__ import annotations


def smart_crop(data: bytes, aspect_w: int, aspect_h: int) -> bytes:
    """Crop to ``aspect_w:aspect_h``, centered on the main subject. Returns PNG."""
    import cv2
    import numpy as np

    arr = np.frombuffer(data, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise RuntimeError("Could not decode the image for smart crop.")

    h, w = img.shape[:2]
    cx, cy = _subject_center(img)
    target = aspect_w / aspect_h
    cw, ch = _crop_size(w, h, target)

    x0 = _clamp(cx - cw // 2, 0, w - cw)
    y0 = _clamp(cy - ch // 2, 0, h - ch)
    cropped = img[y0:y0 + ch, x0:x0 + cw]

    ok, buf = cv2.imencode(".png", cropped)
    if not ok:
        raise RuntimeError("Failed to encode the cropped image.")
    return buf.tobytes()


def _subject_center(img) -> tuple[int, int]:
    """Return the (x, y) center of the largest detected face, or the image center."""
    import cv2

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    cascade = cv2.CascadeClassifier(cascade_path)
    faces = cascade.detectMultiScale(
        gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30)
    )

    if len(faces) == 0:
        h, w = img.shape[:2]
        return w // 2, h // 2

    x, y, fw, fh = max(faces, key=lambda f: f[2] * f[3])
    return x + fw // 2, y + fh // 2


def _crop_size(w: int, h: int, target: float) -> tuple[int, int]:
    """Largest crop with aspect ratio ``target`` that fits within (w, h)."""
    if target >= w / h:
        cw, ch = w, round(w / target)        # width-limited
    else:
        ch, cw = h, round(h * target)        # height-limited
    return max(1, min(cw, w)), max(1, min(ch, h))


def _clamp(v: int, lo: int, hi: int) -> int:
    return max(lo, min(v, hi))
