from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from pydantic import BaseModel
from fastapi_limiter.depends import RateLimiter
from app.core.security import validate_token
from app.services.file_service import FileService

router = APIRouter()

class FileUploadResponse(BaseModel):
    """Response body for a successful file upload, including the public URL."""
    filename: str
    public_url: str

@router.post("/files/upload", response_model=FileUploadResponse, summary="Upload a file", description="Upload a file to Supabase storage and receive a public URL.")
async def upload_file(file: UploadFile = File(...), current_user_id: str = Depends(validate_token), rate_limit: RateLimiter = Depends(RateLimiter(times=2, seconds=300))):
    """Upload a file to Supabase storage and return its public URL."""
    # File type and size validation
    allowed_types = {"image/jpeg", "image/png", "image/gif"}
    max_size = 5 * 1024 * 1024  # 5MB
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG, PNG, and GIF are allowed.")
    contents = await file.read()
    if len(contents) > max_size:
        raise HTTPException(status_code=400, detail="File too large. Max size is 5MB.")
    # Save the file temporarily to a local path before uploading to Supabase
    temp_file_path = f"/tmp/{file.filename}"
    with open(temp_file_path, "wb") as buffer:
        buffer.write(contents)
    file_service = FileService()
    bucket_name = "user-uploads" # This should ideally be dynamic or configured
    try:
        public_url = file_service.upload_file(bucket_name, temp_file_path, file.filename)
        # Clean up the temporary file
        import os
        os.remove(temp_file_path)
        return {"filename": file.filename, "public_url": public_url}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Could not upload file: {e}")

# Add endpoints for downloading and deleting files as needed, with proper authorization