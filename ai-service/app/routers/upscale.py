from fastapi import APIRouter, File, Form, HTTPException, Response, UploadFile

from app.services import upscale as upscale_service
from app.services.common import read_and_validate

router = APIRouter()


@router.post("/upscale")
async def upscale(file: UploadFile = File(...), scale: int = Form(...)):
    """Upscale the image 2x or 4x with Real-ESRGAN; returns a PNG."""
    if scale not in (2, 4):
        raise HTTPException(status_code=400, detail="scale must be 2 or 4.")

    data = await read_and_validate(file)
    png = upscale_service.upscale(data, scale)
    return Response(content=png, media_type="image/png")
