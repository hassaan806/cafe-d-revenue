from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .db.database import create_tables
from .api.auth import router as auth_router
from .api.products import router as products_router
from .api.customers import router as customers_router
from .api.sales import router as sales_router
from .api.categories import router as categories_router
from .api.users import router as users_router
from .api.dashboard import router as dashboard_router
from .api.reports import router as reports_router
from .api.settings import router as settings_router

# Create FastAPI instance
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Backend API for Cafe Revenue Management System",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables on startup
@app.on_event("startup")
async def startup_event():
    create_tables()

# Health check endpoint
@app.get("/")
async def root():
    return {
        "message": "Cafe Revenue Management API",
        "version": settings.APP_VERSION,
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include API routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(users_router, prefix="/users", tags=["Users"])
app.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(products_router, prefix="/products", tags=["Products"])
app.include_router(customers_router, prefix="/customers", tags=["Customers"])
app.include_router(sales_router, prefix="/sales", tags=["Sales"])
app.include_router(categories_router, prefix="/categories", tags=["Categories"])
app.include_router(reports_router, prefix="/reports", tags=["Reports"])
app.include_router(settings_router, prefix="/settings", tags=["Settings"])