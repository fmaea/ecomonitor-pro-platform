from flask import Blueprint, request, jsonify
from backend.src.controllers.auth_controller import register_user_controller, login_user_controller

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/register', methods=['POST'])
def register_route():
    """
    Registration route. Expects JSON data with user details.
    """
    data = request.get_json()
    if not data:
        return jsonify({'message': 'Request body must be JSON'}), 400

    response, status_code = register_user_controller(data)
    return jsonify(response), status_code

@auth_bp.route('/login', methods=['POST'])
def login_route():
    """
    Login route. Expects JSON data with username_or_email and password.
    """
    data = request.get_json()
    if not data:
        return jsonify({'message': 'Request body must be JSON'}), 400

    response, status_code = login_user_controller(data)
    return jsonify(response), status_code
