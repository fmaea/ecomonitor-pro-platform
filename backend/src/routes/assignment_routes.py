from flask import Blueprint, jsonify, request
from backend.src.utils.decorators import jwt_required, roles_required
from backend.src.controllers import assignment_controller # Corrected import path

assignment_bp = Blueprint('assignments', __name__, url_prefix='/assignments')

# POST /assignments/<assignment_id>/submissions - Student submits an assignment
@assignment_bp.route('/<int:assignment_id>/submissions', methods=['POST'])
@jwt_required
@roles_required(['student']) # Only students can submit
def submit_assignment_route(current_user, assignment_id: int):
    """
    Route for a student to submit an assignment.
    `current_user` is injected by @jwt_required.
    """
    data = request.get_json()
    if not data:
        return jsonify({'message': 'Request body must be JSON'}), 400

    response, status_code = assignment_controller.submit_assignment_controller(
        current_student_id=current_user.id,
        assignment_id=assignment_id,
        request_data=data
    )
    return jsonify(response), status_code

# GET /assignments/<assignment_id>/submissions/me - Student gets their own submission
@assignment_bp.route('/<int:assignment_id>/submissions/me', methods=['GET'])
@jwt_required
@roles_required(['student']) # Students view their own submissions
def get_my_submission_route(current_user, assignment_id: int):
    """
    Route for a student to retrieve their own submission for a specific assignment.
    """
    response, status_code = assignment_controller.get_my_submission_controller(
        current_student_id=current_user.id,
        assignment_id=assignment_id
    )
    return jsonify(response), status_code


# --- Teacher specific routes for assignments ---
# These are on the `assignment_bp` as they are actions on specific assignments,
# although creating an assignment itself might be on `course_bp` (e.g. POST /courses/<id>/assignments)

# GET /assignments/<assignment_id>/submissions - Teacher lists all submissions for an assignment
@assignment_bp.route('/<int:assignment_id>/submissions', methods=['GET'])
@jwt_required
@roles_required(['teacher']) # Only teachers can view all submissions for an assignment
def list_submissions_for_assignment_route(current_user, assignment_id: int):
    """
    Route for a teacher to list all submissions for a specific assignment.
    """
    response, status_code = assignment_controller.list_submissions_for_assignment_controller(
        current_teacher_id=current_user.id,
        assignment_id=assignment_id
    )
    return jsonify(response), status_code

# POST /assignments/submissions/<submission_id>/grade - Teacher grades a submission
@assignment_bp.route('/submissions/<int:submission_id>/grade', methods=['POST']) # Route changed to avoid conflict
@jwt_required
@roles_required(['teacher']) # Only teachers can grade
def grade_submission_route(current_user, submission_id: int):
    """
    Route for a teacher to grade a specific submission.
    """
    data = request.get_json()
    if not data:
        return jsonify({'message': 'Request body must be JSON'}), 400

    response, status_code = assignment_controller.grade_submission_controller(
        current_teacher_id=current_user.id,
        submission_id=submission_id,
        request_data=data
    )
    return jsonify(response), status_code
