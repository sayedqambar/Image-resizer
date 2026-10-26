# syntax=docker/dockerfile:1
#
# Image Resizer — AI service (FastAPI + rembg + Real-ESRGAN + OpenCV)
#
# Python 3.11 is used (not 3.12/3.13/3.15) because basicsr and rembg have
# pre-built wheels for 3.11 and the torch CPU build is fully supported there.
#
# Build:
#   docker build -t image-resizer-ai .
#
# Run:
#   docker run -p 8000:8000 \
#     -v /host/path/weights:/app/app/weights \   # cache model weights
#     image-resizer-ai

FROM python:3.11-slim

# System libraries required by opencv-python-headless
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       libgl1 libglib2.0-0 curl \
    && rm -rf /var/lib/apt/lists/*

# Non-root user for safety
RUN useradd -m -u 1001 appuser

WORKDIR /app

# ── Install CPU-only PyTorch FIRST so pip doesn't pull the large CUDA wheel ──
RUN pip install --no-cache-dir \
    torch==2.1.2 torchvision==0.16.1 \
    --index-url https://download.pytorch.org/whl/cpu

# ── Install remaining ML + web dependencies ───────────────────────────────────
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Copy application code ─────────────────────────────────────────────────────
COPY --chown=appuser:appuser . .

USER appuser

# Weights are cached in app/weights/ — mount a volume here so they persist
# across container restarts and don't need to be re-downloaded every time.
VOLUME ["/app/app/weights"]

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", \
     "--workers", "1", "--timeout-keep-alive", "620"]
