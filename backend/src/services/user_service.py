from backend.src.models.user_model import User
from backend.src.extensions import db

class UserServiceError(Exception):
    """Custom exception for user service errors."""
    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.status_code = status_code

def create_user(data: dict) -> User:
    """
    Creates a new user.
    :param data: Dictionary containing user data (username, email, password, role, etc.)
    :return: The created User object
    :raises UserServiceError: If username or email already exists or for other validation errors.
    """
    required_fields = ['username', 'email', 'password', 'role']
    for field in required_fields:
        if field not in data or not data[field]:
            raise UserServiceError(f"Missing required field: {field}", 400)

    if data['role'] not in ['student', 'teacher']:
        raise UserServiceError(f"Invalid role: {data['role']}. Must be 'student' or 'teacher'.", 400)

    if User.query.filter((User.username == data['username']) | (User.email == data['email'])).first():
        raise UserServiceError("Username or email already exists", 409) # 409 Conflict

    new_user = User(
        username=data['username'],
        email=data['email'],
        role=data['role'],
        first_name=data.get('first_name'),
        last_name=data.get('last_name'),
        profile_picture_url=data.get('profile_picture_url')
    )
    new_user.set_password(data['password'])

    try:
        db.session.add(new_user)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        # Log the exception e
        raise UserServiceError(f"Database error: {str(e)}", 500)

    return new_user

def authenticate_user(username_or_email: str, password: str) -> User | None:
    """
    Authenticates a user by username/email and password.
    :param username_or_email: Username or email of the user.
    :param password: Password to check.
    :return: User object if authentication is successful, otherwise None.
    """
    user = User.query.filter((User.username == username_or_email) | (User.email == username_or_email)).first()

    if user and user.check_password(password):
        return user
    return None

def get_user_by_id(user_id: int) -> User | None:
    """
    Fetches a user by their ID.
    :param user_id: The ID of the user to fetch.
    :return: User object if found, otherwise None.
    """
    return User.query.get(user_id)

def update_user_profile(user_id: int, data: dict) -> User | None:
    """
    Updates a user's profile.
    :param user_id: The ID of the user to update.
    :param data: Dictionary containing data to update (e.g., first_name, last_name, email).
    :return: The updated User object or None if user not found.
    :raises UserServiceError: If email already exists for another user or for other validation errors.
    """
    user = User.query.get(user_id)
    if not user:
        return None # Or raise UserServiceError("User not found", 404)

    allowed_fields = ['first_name', 'last_name', 'email', 'profile_picture_url']
    updated = False

    for field in allowed_fields:
        if field in data:
            new_value = data[field]
            if field == 'email' and new_value != user.email:
                # Check if the new email is already taken by another user
                existing_user = User.query.filter(User.email == new_value, User.id != user_id).first()
                if existing_user:
                    raise UserServiceError(f"Email '{new_value}' is already taken.", 409)
                setattr(user, field, new_value)
                updated = True
            elif getattr(user, field) != new_value:
                setattr(user, field, new_value)
                updated = True

    if updated:
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            # Log the exception e
            raise UserServiceError(f"Database error during profile update: {str(e)}", 500)

    return user
