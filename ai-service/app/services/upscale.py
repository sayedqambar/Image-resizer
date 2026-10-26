"""Image upscaling with Real-ESRGAN (2x or 4x).

basicsr 1.4.2 imports torchvision.transforms.functional_tensor which was removed
in torchvision >=0.17. We install a shim at module-load time — before any
basicsr submodule can be imported — so the first import succeeds regardless of
import order.

All other heavy deps (cv2, torch, basicsr, realesrgan) are still imported lazily
inside upscale() so the FastAPI app starts instantly.
"""
from __future__ import annotations

import os
import sys
import types

from app.config import WEIGHTS_DIR

# ── torchvision compatibility shim ───────────────────────────────────────────
# Must run before anything touches basicsr or realesrgan.
def _install_torchvision_shim() -> None:
    _MOD = "torchvision.transforms.functional_tensor"
    if _MOD in sys.modules:
        return
    try:
        from torchvision.transforms.functional import rgb_to_grayscale  # noqa: PLC0415
        shim = types.ModuleType(_MOD)
        shim.rgb_to_grayscale = rgb_to_grayscale
        sys.modules[_MOD] = shim
    except ImportError:
        pass  # torchvision not available; upscale() will raise a clear message

_install_torchvision_shim()

# ── weight management ─────────────────────────────────────────────────────────
_WEIGHT_URLS = {
    2: "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.1/RealESRGAN_x2plus.pth",
    4: "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth",
}


def _ensure_weight(scale: int) -> str:
    """Download the model weight for *scale* if not already cached."""
    import urllib.request

    os.makedirs(WEIGHTS_DIR, exist_ok=True)
    path = os.path.join(WEIGHTS_DIR, f"RealESRGAN_x{scale}plus.pth")
    if not os.path.exists(path):
        urllib.request.urlretrieve(_WEIGHT_URLS[scale], path)
    return path


# ── public API ────────────────────────────────────────────────────────────────
def upscale(data: bytes, scale: int) -> bytes:
    """Upscale *data* by *scale* (2 or 4) using Real-ESRGAN; returns PNG bytes."""
    import cv2
    import numpy as np
    import torch
    from basicsr.archs.rrdbnet_arch import RRDBNet
    from realesrgan import RealESRGANer  # correct class name in realesrgan 0.3.x

    arr = np.frombuffer(data, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise RuntimeError("Could not decode the image for upscaling.")

    model = RRDBNet(
        num_in_ch=3, num_out_ch=3,
        num_feat=64, num_block=23, num_grow_ch=32,
        scale=scale,
    )
    weights = _ensure_weight(scale)
    device  = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    try:
        upsampler = RealESRGANer(
            scale=scale,
            model_path=weights,
            model=model,
            tile=400,
            tile_pad=10,
            pre_pad=0,
            half=False,   # half-precision only safe on CUDA
            device=device,
        )
        output, _ = upsampler.enhance(img, outscale=scale)
    except Exception as exc:
        raise RuntimeError(f"Upscaling failed: {exc}") from exc

    ok, buf = cv2.imencode(".png", output)
    if not ok:
        raise RuntimeError("Failed to encode the upscaled image.")
    return buf.tobytes()
