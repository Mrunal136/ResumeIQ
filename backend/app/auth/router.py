from fastapi import APIRouter, HTTPException, status, Response, Depends
from datetime import datetime, timezone
from bson import ObjectId
from app.database import get_db, is_db_connected
from app.auth.schemas import UserCreate, UserLogin, UserResponse
from app.auth.service import hash_password, verify_password, create_access_token, create_refresh_token
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    if not is_db_connected():
        raise HTTPException(status_code=503, detail="Database unavailable")
    db = get_db()

    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )

    user_doc = {
        "name": user_data.name,
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "role": user_data.role.value,
        "created_at": datetime.now(timezone.utc)
    }
    result = await db.users.insert_one(user_doc)

    return UserResponse(
        id=str(result.inserted_id),
        name=user_data.name,
        email=user_data.email,
        role=user_data.role.value,
        created_at=user_doc["created_at"].isoformat()
    )


@router.post("/login")
async def login(user_data: UserLogin, response: Response):
    if not is_db_connected():
        raise HTTPException(status_code=503, detail="Database unavailable")
    db = get_db()

    user = await db.users.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    token_data = {
        "user_id": str(user["_id"]),
        "email": user["email"],
        "role": user["role"]
    }

    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,  # Set True in production
        samesite="lax",
        max_age=15 * 60
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=7 * 24 * 60 * 60
    )

    return {
        "message": "Login successful",
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "role": user["role"]
        }
    }


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        role=user["role"]
    )
