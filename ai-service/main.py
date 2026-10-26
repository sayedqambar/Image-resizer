"""FastAPI app for the Image Resizer AI service.

Endpoints:
    GET  /remove-background  (health is below)
    POST /remove-background  rembg background removal -> PNG (alpha)
    POST /upscale            Real-ESRGAN 2x/4x upscaling -> PNG
    POST /smart-crop         face/subject-aware crop to a width:height ratio -> PNG

Heavy ML libraries (rembg, torch/Real-ESRGAN, OpenCV) are imported lazily inside
the service functions, so the app starts quickly and only pulls in a dependency
when its endpoint is actually called.
"""
from fastapi import FastAPI
from fastapi.responses import JSONResponse

from app.routers import background, upscale, smartcrop

app = FastAPI(title="Image Resizer AI Service", version="0.1.0")


@app.get("/health")
def health() -> dict:
    """Liveness check."""
    return {"status": "ok"}


@app.exception_handler(RuntimeError)
async def _runtime_error_handler(request, exc: RuntimeError):
    """Turn service-layer failures (decode/model errors) into clean 500 JSON."""
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc) or "Internal Server Error"},
    )


app.include_router(background.router)
app.include_router(upscale.router)
app.include_router(smartcrop.router)
