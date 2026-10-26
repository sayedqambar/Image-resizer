"""Shared helpers for upload handling.

`read_and_validate` enforces content-type and size limits and returns the raw
image bytes. It reads the upload in chunks so an oversized file is rejected
without loading the whole thing into memory first.
"""
from __future__ import annotations

from fastapi import HTTPException, UploadFile

from app import config


async def read_and_validate(file: UploadFile | None) -> bytes:
    """Validate the upload's type and size, then return its bytes."""
    if file is None:
        raise HTTPException(status_code=400, detail="No file was uploaded.")

    if file.content_type not in config.ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail=(
                f"Unsupported file type: {file.content_type}. "
                f"Allowed: {', '.join(config.ALLOWED_CONTENT_TYPES)}."
            ),
        )

    return await read_capped(file, config.MAX_UPLOAD_BYTES)


async def read_capped(file: UploadFile, max_bytes: int) -> bytes:
    """Read an upload in 1 MB chunks, rejecting anything over ``max_bytes``."""
    chunks: list[bytes] = []
    total = 0
    while True:
        chunk = await file.read(1024 * 1024)
        if not chunk:
            break
        total += len(chunk)
        if total > max_bytes:
            raise HTTPException(
                status_code=413,
                detail=f"File exceeds the {max_bytes // (1024 * 1024)} MB upload limit.",
            )
        chunks.append(chunk)
    data = b"".join(chunks)
    if not data:
        raise HTTPException(status_code=400, detail="The uploaded file was empty.")
    return data
