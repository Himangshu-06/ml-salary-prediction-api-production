"""
CompAnalytics API — FastAPI Application Entry Point

Configures CORS, request-ID middleware, structured logging,
and loads the ML model on startup.
"""

import os
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from app.config import get_settings
from app.logging_config import (
    setup_logging,
    get_logger,
    generate_request_id,
    request_id_var,
)
from app.routes import router
from ml.model_service import model_service

settings = get_settings()
logger = get_logger("main")


# ── Lifespan (startup/shutdown) ───────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — load model on startup."""
    setup_logging(settings.api_log_level)
    logger.info(
        "starting",
        env=settings.api_env,
        cors_origins=settings.cors_origins,
    )

    # Resolve model path relative to api/ directory
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    model_path = os.path.join(base_dir, settings.model_path)
    metadata_path = os.path.join(base_dir, settings.model_metadata_path)

    try:
        model_service.load(model_path, metadata_path)
        logger.info("model_ready", version=model_service.model_version)
    except FileNotFoundError:
        logger.warning(
            "model_not_found",
            message="API starting without model. Run 'python -m ml.train' first.",
        )
    except Exception as e:
        logger.error("model_load_error", error=str(e))

    yield

    logger.info("shutting_down")


# ── App Creation ──────────────────────────────────────────────────────

app = FastAPI(
    title="CompAnalytics API",
    description=(
        "ML-powered employee compensation intelligence — "
        "predicts fair salary with explainable, data-backed benchmarks."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
)


# ── CORS Middleware ───────────────────────────────────────────────────
# Explicit origins — never wildcard (*)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# ── Request-ID Middleware ─────────────────────────────────────────────

@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    """Inject a unique request ID into every request for tracing."""
    req_id = generate_request_id()
    request_id_var.set(req_id)

    start_time = time.time()
    response = await call_next(request)
    latency = round((time.time() - start_time) * 1000, 1)

    response.headers["X-Request-ID"] = req_id
    response.headers["X-Response-Time"] = f"{latency}ms"

    logger.info(
        "request",
        request_id=req_id,
        method=request.method,
        path=str(request.url.path),
        status=response.status_code,
        latency_ms=latency,
    )

    # Log request to Supabase Postgres (graceful fallback if Supabase not configured)
    ip_address = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    clerk_user_id = request.headers.get("x-user-id")
    from app.supabase_client import log_usage_to_supabase
    log_usage_to_supabase(
        endpoint=str(request.url.path),
        method=request.method,
        status_code=response.status_code,
        latency_ms=latency,
        request_id=req_id,
        clerk_user_id=clerk_user_id,
        ip_address=ip_address,
        user_agent=user_agent
    )

    return response


# ── Global Exception Handlers ────────────────────────────────────────

@app.exception_handler(ValidationError)
async def validation_error_handler(request: Request, exc: ValidationError):
    """Return 422 with structured error, never a raw stack trace."""
    return JSONResponse(
        status_code=422,
        content={
            "error": "validation_error",
            "message": "Invalid input data",
            "details": exc.errors(),
        },
    )


@app.exception_handler(Exception)
async def generic_error_handler(request: Request, exc: Exception):
    """Catch-all — never leak internal errors to the client."""
    logger.error("unhandled_exception", error=str(exc), exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "internal_error",
            "message": "An unexpected error occurred. Please try again.",
        },
    )


# ── Register Routes ──────────────────────────────────────────────────

app.include_router(router)


# ── Root Redirect ─────────────────────────────────────────────────────

@app.get("/", include_in_schema=False)
async def root():
    """Root endpoint — redirect to docs or return basic info."""
    return {
        "name": "CompAnalytics API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/v1/health",
    }
