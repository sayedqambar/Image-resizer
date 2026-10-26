from fastapi import APIRouter, File, Form, HTTPException, Response, UploadFile

from app.services import smartcrop as smartcrop_service
from app.services.common import read_and_validate

router = APIRouter()


@router.post("/smart-crop")
async def smart_crop(
    file: UploadFile = File(...),
    aspect_w: int = Form(...),
    aspect_h: int = Form(...),
):
    """Crop to ``aspect_w:aspect_h`` centered on the detected subject; returns a PNG."""
    if aspect_w < 1 or aspect_h < 1:
        raise HTTPException(
            status_code=400,
            detail="aspect_w and aspect_h must be positive integers.",
        )

    data = await read_and_validate(file)
    png = smartcrop_service.smart_crop(data, aspect_w, aspect_h)
    return Response(content=png, media_type="image/png")
