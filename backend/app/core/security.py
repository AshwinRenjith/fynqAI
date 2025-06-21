from fastapi import HTTPException, Security
from fastapi import Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from pydantic import ValidationError

from .config import settings

reusable_oauth2 = HTTPBearer()

def validate_token(credentials: HTTPAuthorizationCredentials = Security(reusable_oauth2)) -> str:
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
            options={"verify_aud": True}
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=403, detail="Could not validate credentials: User ID missing")
        return user_id
    except JWTError:
        raise HTTPException(status_code=403, detail="Could not validate credentials: Invalid token")
    except ValidationError:
        raise HTTPException(status_code=403, detail="Could not validate credentials: Token validation error")