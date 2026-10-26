"""Background removal with rembg.

rembg's ``remove`` returns PNG bytes with an alpha channel. The model (U2-Net)
is downloaded to a cache on the first call. rembg is imported lazily so the
service module can be imported without the (large) dependency installed.
"""
from __future__ import annotations


def remove_background(data: bytes) -> bytes:
    """Remove the image background and return PNG bytes with transparency."""
    from rembg import remove  # lazy: heavy dependency

    try:
        return remove(data)
    except Exception as exc:  # model/inference errors -> clean 500
        raise RuntimeError(f"Background removal failed: {exc}") from exc
