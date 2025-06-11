from backend.src.services import user_service
from backend.src.services.user_service import UserServiceError
from backend.src.utils.security import generate_jwt

def register_user_controller(request_data: dict):
    """
    Controller function to handle user registration.
    Validates request data and calls the user service to create a new user.
    Returns a tuple of (response_data, status_code).
    """
    # Basic validation (more can be added, e.g., password complexity, email format)
    required_fields = ['username', 'email', 'password', 'role']
    if not all(field in request_data for field in required_fields):
        return {'message': 'Missing required fields (username, email, password, role)'}, 400

    try:
        user = user_service.create_user(request_data)
        # Do not return password_hash
        user_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'profile_picture_url': user.profile_picture_url,
            'created_at': user.created_at.isoformat(),
            'updated_at': user.updated_at.isoformat()
        }
        return {'message': 'User registered successfully', 'user': user_data}, 201
    except UserServiceError as e:
        return {'message': str(e)}, e.status_code
    except Exception as e:
        # Log the exception e
        return {'message': f'An unexpected error occurred: {str(e)}'}, 500

def login_user_controller(request_data: dict):
    """
    Controller function to handle user login.
    Validates request data, authenticates the user, and generates a JWT upon success.
    Returns a tuple of (response_data, status_code).
    """
    if not request_data or not request_data.get('username_or_email') or not request_data.get('password'):
        return {'message': 'Missing username/email or password'}, 400

    username_or_email = request_data['username_or_email']
    password = request_data['password']

    user = user_service.authenticate_user(username_or_email, password)

    if user:
        try:
            access_token = generate_jwt(user.id, user.role)
            # Include user details in the response along with the token
            user_data = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role
            }
            return {
                'message': 'Login successful',
                'access_token': access_token,
                'user': user_data
            }, 200
        except Exception as e:
            # Log the exception e (e.g., if SECRET_KEY is not set, though app startup should handle this)
            return {'message': f'Error generating token: {str(e)}'}, 500
    else:
        return {'message': 'Invalid credentials'}, 401
