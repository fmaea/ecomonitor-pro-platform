import enum
from backend.src.extensions import db
from backend.src.utils.security import hash_password, check_password_hash
from sqlalchemy.sql import func
# Removed: from sqlalchemy import Enum as SQLAlchemyEnum

# Define RoleEnum as a Python enum
class RoleEnum(enum.Enum):
    STUDENT = 'student'
    TEACHER = 'teacher'
    # ADMIN = 'admin' # Example for future expansion

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(255), unique=True, nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    # Use db.Enum, passing the Python RoleEnum class
    role = db.Column(db.Enum(RoleEnum), nullable=False)
    first_name = db.Column(db.String(255), nullable=True)
    last_name = db.Column(db.String(255), nullable=True)
    profile_picture_url = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.TIMESTAMP, server_default=func.now())
    updated_at = db.Column(db.TIMESTAMP, server_default=func.now(), onupdate=func.now())

    def __init__(self, username, email, role: RoleEnum, first_name=None, last_name=None, profile_picture_url=None):
        self.username = username
        self.email = email
        if not isinstance(role, RoleEnum):
            raise ValueError(f"Invalid role type. Expected RoleEnum, got {type(role)}")
        self.role = role
        self.first_name = first_name
        self.last_name = last_name
        self.profile_picture_url = profile_picture_url

    def set_password(self, password):
        self.password_hash = hash_password(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.username}>'

    def to_dict(self, include_sensitive=False):
        """
        Converts the User object to a dictionary.
        Excludes password_hash by default.
        Can include other sensitive fields based on the `include_sensitive` flag if needed later.
        """
        data = {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role.value if isinstance(self.role, RoleEnum) else str(self.role), # Ensure role is stringified
            'first_name': self.first_name,
            'last_name': self.last_name,
            'profile_picture_url': self.profile_picture_url,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        # Example for conditional sensitive data, though not used for password_hash here
        # if include_sensitive:
        #     data['some_other_sensitive_field'] = self.some_other_sensitive_field
        return data
