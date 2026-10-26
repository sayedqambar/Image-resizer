from fastapi import APIRouter, File, Response, UploadFile

from app.services import background as background_service
from app.services.common import read_and_validate

router = APIRouter()


@router.post("/remove-background")
async def remove_background(file: UploadFile = File(...)):
    """Remove the background; returns a PNG with transparency."""
    data = await read_and_validate(file)
    png = background_service.remove_background(data)
    return Response(content=png, media_type="image/png")
