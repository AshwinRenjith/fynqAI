
from fastapi import FastAPI
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi_limiter import FastAPILimiter
from redis.asyncio import Redis
from .api import auth, gemini, files
from .core.celery_app import celery_app
from .tasks.example_tasks import add_numbers, process_image
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi import HTTPException
import logging

app = FastAPI(
    title="fynq AI Tutor Platform Backend",
    description="API for fynq AI Tutor Platform, providing AI-powered tutoring and content management.",
    version="0.0.1",
)

# Updated CORS configuration to fix the OPTIONS request issues
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:3000", "https://*.lovable.app"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1", tags=["Authentication"])
app.include_router(gemini.router, prefix="/api/v1", tags=["Gemini AI"])
app.include_router(files.router, prefix="/api/v1", tags=["File Storage"])

@app.on_event("startup")
async def startup():
    try:
        redis = Redis(host="localhost", port=6379, db=0)
        await FastAPILimiter.init(redis)
    except Exception as e:
        print(f"Redis connection failed: {e}")
        print("Continuing without rate limiting...")

@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "Welcome to the fynq AI Tutor Platform Backend!"}

@app.post("/api/v1/tasks/add", tags=["Tasks"])
async def run_add_task(x: int, y: int):
    task = add_numbers.delay(x, y)
    return {"task_id": task.id, "status": "Task sent to Celery"}

@app.post("/api/v1/tasks/process-image", tags=["Tasks"])
async def run_process_image_task(image_path: str):
    task = process_image.delay(image_path)
    return {"task_id": task.id, "status": "Task sent to Celery"}

# Custom error handler for HTTPException
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "error": True},
    )

# Custom error handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "error": True},
    )

# Custom error handler for unhandled exceptions
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logging.error(f"Unhandled error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": True},
    )
