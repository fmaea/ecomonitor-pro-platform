from backend.src.services import user_service
from backend.src.services.user_service import UserServiceError

def get_user_profile_controller(current_user_id: int):
    """
    Controller to get the profile of the currently authenticated user.
    Relies on current_user_id being passed from a JWT decorator.
    """
    user = user_service.get_user_by_id(current_user_id)
    if not user:
        return {'message': 'User not found'}, 404

    return {'message': 'User profile fetched successfully', 'user': user.to_dict()}, 200

def update_user_profile_controller(current_user_id: int, request_data: dict):
    """
    Controller to update the profile of the currently authenticated user.
    Relies on current_user_id being passed from a JWT decorator.
    """
    if not request_data:
        return {'message': 'No data provided for update'}, 400

    # Basic validation: ensure no disallowed fields are being updated (e.g., role, id)
    # More specific validation (e.g. email format) can be added here or in the service layer.
    allowed_to_update = ['first_name', 'last_name', 'email', 'profile_picture_url']
    update_data = {key: value for key, value in request_data.items() if key in allowed_to_update}

    if not update_data:
        return {'message': 'No valid fields provided for update. Allowed fields: ' + ", ".join(allowed_to_update)}, 400

    try:
        updated_user = user_service.update_user_profile(current_user_id, update_data)
        if not updated_user:
            return {'message': 'User not found or update failed'}, 404 # Should ideally be caught by service
        return {'message': 'User profile updated successfully', 'user': updated_user.to_dict()}, 200
    except UserServiceError as e:
        return {'message': str(e)}, e.status_code
    except Exception as e:
        # Log the exception e
        return {'message': f'An unexpected error occurred during profile update: {str(e)}'}, 500

# Example for a potential admin-only controller function
# from backend.src.utils.decorators import roles_required
# @roles_required(['admin']) # Assuming 'admin' is a role
# def get_all_users_controller(current_user): # current_user passed by @jwt_required
#     # ... logic to get all users ...
#     pass
