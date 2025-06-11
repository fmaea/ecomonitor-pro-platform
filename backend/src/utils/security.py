import bcrypt

def hash_password(password: str) -> str:
    """Hashes a password using bcrypt."""
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed_password.decode('utf-8')

def check_password_hash(hashed_password: str, password: str) -> bool:
    """Checks a plain password against a bcrypt hashed password."""
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

import jwt
from datetime import datetime, timedelta, timezone
from flask import current_app

def generate_jwt(user_id: int, user_role: str) -> str:
    """
    Generates a JWT for a given user ID and role.
    """
    payload = {
        'user_id': user_id,
        'role': user_role,
        'exp': datetime.now(timezone.utc) + timedelta(hours=current_app.config.get('JWT_ACCESS_TOKEN_EXPIRES_HOURS', 1)),
        'iat': datetime.now(timezone.utc)
    }
    token = jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')
    return token

def decode_jwt(token: str) -> dict | None:
    """
    Decodes a JWT.
    Returns the payload if the token is valid, otherwise None.
    """
    try:
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        # Handle expired token specific error if needed, e.g., log it
        return None
    except jwt.InvalidTokenError:
        # Handle generic invalid token error if needed, e.g., log it
        return None
    except Exception:
        # Catch any other unforeseen errors during decoding
        return None
