import os
import django
from fastapi import FastAPI
from django.core.asgi import get_asgi_application
from fastapi.middleware.cors import CORSMiddleware

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

# Import your FastAPI app
from main import app as fastapi_app

# Django ASGI app
django_asgi_app = get_asgi_application()

# Add CORS to FastAPI
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "https://preview--fynqai-spark-tutor-flow.lovable.app/",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from starlette.routing import Mount
from starlette.applications import Starlette

# Mount FastAPI at /api/v1, Django at /
application = Starlette(
    routes=[
        Mount("/api/v1", app=fastapi_app),
        Mount("/", app=django_asgi_app),
    ]
) 