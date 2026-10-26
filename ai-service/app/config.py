"""Runtime configuration, overridable via environment variables."""
import os

# Maximum accepted upload size (MB).
MAX_UPLOAD_MB = int(os.environ.get("AI_MAX_UPLOAD_MB", "10"))
MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024

# Accepted upload content types.
ALLOWED_CONTENT_TYPES = ("image/jpeg", "image/png", "image/webp")

# Where Real-ESRGAN model weights are cached.
WEIGHTS_DIR = os.environ.get(
    "AI_WEIGHTS_DIR",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "weights"),
)
