from functools import wraps
from flask import request, jsonify, current_app
from backend.src.utils.security import decode_jwt
from backend.src.models.user_model import User
from backend.src.extensions import db # Assuming db session might be needed if we re-fetch user

def jwt_required(fn):
from backend.src.models.user_model import RoleEnum # Import RoleEnum

def jwt_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'message': 'Authorization header is missing'}), 401

        parts = auth_header.split()
        if parts[0].lower() != 'bearer' or len(parts) == 1 or len(parts) > 2:
            return jsonify({'message': 'Invalid Authorization header format. Expected "Bearer <token>"'}), 401

        token = parts[1]

        if not token:
            return jsonify({'message': 'Token is missing'}), 401

        payload = decode_jwt(token)
        if not payload:
            return jsonify({'message': 'Token is invalid or expired'}), 401 # Or 403 Forbidden

        user_id = payload.get('user_id')
        if not user_id:
            return jsonify({'message': 'Token payload missing user_id'}), 401

        # Fetch user from DB to ensure they exist and are active
        # This also makes the user object available if needed
        current_user = User.query.get(user_id)
        if not current_user:
            return jsonify({'message': 'User not found or token invalid'}), 401

        # Pass the current_user object to the decorated function
        # The decorated function must accept `current_user` as a keyword argument
        return fn(*args, **kwargs, current_user=current_user)
    return wrapper

def roles_required(roles: list):
    """
    Decorator to ensure user has one of the specified roles.
    `roles` is a list of role names (strings).
    Should be used *after* @jwt_required.
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            current_user = kwargs.get('current_user') # Relies on @jwt_required passing this
            if not current_user:
                # This case should ideally not be reached if @jwt_required is always applied first
                # and correctly passes current_user.
                return jsonify({"message": "Authentication context not found. Ensure @jwt_required is used before @roles_required."}), 500

            # current_user.role is an instance of RoleEnum
            # roles is a list of strings e.g. ['teacher', 'admin']
            if not isinstance(current_user.role, RoleEnum):
                 # This might happen if current_user.role is not an Enum type as expected
                 return jsonify({"message": "User role format is incorrect."}), 500

            if current_user.role.value not in roles:
                return jsonify({"message": f"Access denied: Your role ('{current_user.role.value}') is not authorized for this resource. Required roles: {roles}"}), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator
