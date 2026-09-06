from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import auth, bookings, content, packages, properties, room_types, testimonials
from app.routers.admin import auth as admin_auth
from app.routers.admin import bookings as admin_bookings
from app.routers.admin import content as admin_content
from app.routers.admin import dashboard as admin_dashboard
from app.routers.admin import guests as admin_guests
from app.routers.admin import packages as admin_packages
from app.routers.admin import properties as admin_properties
from app.routers.admin import reports as admin_reports
from app.routers.admin import users as admin_users

app = FastAPI(title="Regale Hotels API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(properties.router)
app.include_router(room_types.router)
app.include_router(bookings.router)
app.include_router(testimonials.router)
app.include_router(content.router)
app.include_router(packages.router)

app.include_router(admin_auth.router)
app.include_router(admin_dashboard.router)
app.include_router(admin_bookings.router)
app.include_router(admin_properties.router)
app.include_router(admin_guests.router)
app.include_router(admin_reports.router)
app.include_router(admin_users.router)
app.include_router(admin_content.router)
app.include_router(admin_packages.router)


@app.get("/health")
async def health():
    return {"status": "ok"}


# In production, Vercel's multi-service rewrite forwards the *full* matched
# path (e.g. "/api/backend/health") to this service rather than stripping the
# "/api/backend" prefix — so the same app is also mounted under that prefix.
# Registered after every route above so local dev (hit directly, no prefix)
# keeps working unchanged; the "/api/backend" mount only matters in prod.
api = app
app = FastAPI(title="Regale Hotels API")
app.mount("/api/backend", api)
app.mount("/", api)
