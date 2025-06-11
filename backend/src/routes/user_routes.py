from flask import Blueprint, request, jsonify
from backend.src.utils.decorators import jwt_required
from backend.src.controllers.user_controller import get_user_profile_controller, update_user_profile_controller

user_bp = Blueprint('user', __name__, url_prefix='/users')

@user_bp.route('/profile', methods=['GET'])
@jwt_required
def get_profile_route(current_user): # current_user is injected by @jwt_required
    """
    Route to get the profile of the authenticated user.
    """
    response, status_code = get_user_profile_controller(current_user.id)
    return jsonify(response), status_code

@user_bp.route('/profile', methods=['PUT'])
@jwt_required
def update_profile_route(current_user): # current_user is injected by @jwt_required
    """
    Route to update the profile of the authenticated user.
    Expects JSON data with fields to update.
    """
    data = request.get_json()
    if not data:
        return jsonify({'message': 'Request body must be JSON'}), 400

    response, status_code = update_user_profile_controller(current_user.id, data)
    return jsonify(response), status_code
