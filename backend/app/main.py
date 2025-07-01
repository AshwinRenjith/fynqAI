
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

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="fynq AI Tutor Platform Backend",
    description="API for fynq AI Tutor Platform, providing AI-powered tutoring and content management.",
    version="0.0.1",
)

# CORS configuration - more permissive for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8080", 
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8080",
        "https://*.lovable.app",
        "https://*.lovableproject.com"
    ],
    allow_credentials=False,  # Set to False since we're using Bearer tokens
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
    allow_headers=[
        "Authorization",
        "Content-Type", 
        "Accept",
        "Origin",
        "X-Requested-With",
        "x-client-info",
        "apikey"
    ],
    expose_headers=["*"],
)

# Add request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request: {request.method} {request.url}")
    logger.info(f"Headers: {dict(request.headers)}")
    
    response = await call_next(request)
    
    logger.info(f"Response status: {response.status_code}")
    return response

app.include_router(auth.router, prefix="/api/v1", tags=["Authentication"])
app.include_router(gemini.router, prefix="/api/v1", tags=["Gemini AI"])
app.include_router(files.router, prefix="/api/v1", tags=["File Storage"])

@app.on_event("startup")
async def startup():
    try:
        redis = Redis(host="localhost", port=6379, db=0)
        await FastAPILimiter.init(redis)
        logger.info("Redis connection successful")
    except Exception as e:
        logger.warning(f"Redis connection failed: {e}")
        logger.info("Continuing without rate limiting...")

@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "Welcome to the fynq AI Tutor Platform Backend!", "status": "running"}

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "message": "Backend is running properly"}

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
    logger.error(f"HTTPException: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "error": True},
    )

# Custom error handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"ValidationError: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "error": True},
    )

# Custom error handler for unhandled exceptions
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": True},
    )
