from fastapi import APIRouter, Depends

from core.auth import get_current_user

router = APIRouter(tags=["health"])


@router.get("/health")
async def health():
    """Unauthenticated health check — used by Render to confirm the service is up."""
    return {"status": "ok"}


@router.get("/protected-test")
async def protected_test(payload: dict = Depends(get_current_user)):
    """
    Sprint 1 verification endpoint.
    Returns 401 without a valid Auth0 JWT, 200 with one.
    """
    return {"status": "ok", "sub": payload["sub"]}
