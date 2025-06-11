from flask import Blueprint, jsonify, request
from backend.src.utils.decorators import jwt_required, roles_required
from backend.src.controllers import course_controller, assignment_controller # Import assignment_controller

course_bp = Blueprint('courses', __name__, url_prefix='/courses')

# Student-centric routes (require enrollment)
@course_bp.route('/my-courses', methods=['GET'])
@jwt_required
# @roles_required(['student']) # Add if RoleEnum.STUDENT is 'student' and decorator is ready
def list_my_enrolled_courses(current_user):
    """
    Lists all courses the authenticated student is enrolled in.
    Passes current_user.id which is expected by the controller.
    """
    # current_user object is passed by @jwt_required
    # Assuming 'student' role check is implicitly handled or to be added via @roles_required
    response, status_code = course_controller.list_my_courses_controller(current_user.id)
    return jsonify(response), status_code

@course_bp.route('/my-courses/<int:course_id>', methods=['GET'])
@jwt_required
# @roles_required(['student'])
def get_my_enrolled_course_details(current_user, course_id: int):
    """
    Gets detailed information for a specific course the authenticated student is enrolled in.
    Includes chapters.
    """
    response, status_code = course_controller.get_my_course_details_controller(current_user.id, course_id)
    return jsonify(response), status_code

# Public/General course routes (do not require enrollment, but JWT for user context if needed)
@course_bp.route('/', methods=['GET'])
# No @jwt_required here if truly public, or @jwt_optional if context is useful but not mandatory
def list_all_courses():
    """
    Lists all available courses. (Public access)
    """
    response, status_code = course_controller.list_all_public_courses_controller()
    return jsonify(response), status_code

@course_bp.route('/<int:course_id>', methods=['GET'])
# No @jwt_required here if truly public
def get_course_details(course_id: int):
    """
    Gets detailed information for a specific course. (Public access)
    Includes chapters.
    """
    response, status_code = course_controller.get_public_course_details_controller(course_id)
    return jsonify(response), status_code

@course_bp.route('/<int:course_id>/chapters', methods=['GET'])
@jwt_required # Require JWT to see if user is enrolled, for conditional access to chapters perhaps
def get_chapters_for_course(current_user, course_id: int):
    """
    Gets all chapters for a specific course.
    The controller/service might differentiate access based on enrollment status.
    current_user.id is passed to the controller for this check.
    """
    # If this route should be public, remove @jwt_required and pass None for user_id
    # For now, assuming only logged-in users can see chapters, enrollment checked by controller/service.
    response, status_code = course_controller.get_course_chapters_controller(course_id, current_user_id=current_user.id)
    return jsonify(response), status_code

# --- Teacher specific routes ---

@course_bp.route('/teaching', methods=['GET'])
@jwt_required
@roles_required(['teacher'])
def list_my_teaching_courses(current_user):
    """ Lists courses taught by the authenticated teacher. """
    response, status_code = course_controller.list_my_taught_courses_controller(current_user.id)
    return jsonify(response), status_code

@course_bp.route('/', methods=['POST'])
@jwt_required
@roles_required(['teacher'])
def create_new_course_route(current_user):
    """ Creates a new course. Authenticated user must be a teacher. """
    data = request.get_json()
    if not data:
        return jsonify({'message': 'Request body must be JSON'}), 400
    response, status_code = course_controller.create_new_course_controller(current_user.id, data)
    return jsonify(response), status_code

@course_bp.route('/<int:course_id>/chapters', methods=['POST'])
@jwt_required
@roles_required(['teacher'])
def add_chapter_to_course_route(current_user, course_id: int):
    """ Adds a chapter to a course. Authenticated user must be the teacher of the course. """
    data = request.get_json()
    if not data:
        return jsonify({'message': 'Request body must be JSON'}), 400
    response, status_code = course_controller.add_chapter_controller(current_user.id, course_id, data)
    return jsonify(response), status_code

@course_bp.route('/<int:course_id>/enrollments', methods=['POST'])
@jwt_required
@roles_required(['teacher'])
def enroll_student_in_course_route(current_user, course_id: int):
    """ Enrolls a student into a course. Authenticated user must be the teacher of the course. """
    data = request.get_json()
    if not data:
        return jsonify({'message': 'Request body must be JSON'}), 400
    response, status_code = course_controller.enroll_student_controller(current_user.id, course_id, data)
    return jsonify(response), status_code

@course_bp.route('/<int:course_id>/students', methods=['GET'])
@jwt_required
@roles_required(['teacher'])
def list_students_in_course_route(current_user, course_id: int):
    """ Lists students enrolled in a specific course taught by the authenticated teacher. """
    response, status_code = course_controller.list_enrolled_students_in_course_controller(current_user.id, course_id)
    return jsonify(response), status_code


# --- Routes related to Assignments within a Course ---

# GET /courses/<course_id>/assignments - Student lists assignments for an enrolled course
@course_bp.route('/<int:course_id>/assignments', methods=['GET'])
@jwt_required
# @roles_required(['student', 'teacher']) # Both students and teachers might see assignments
def list_course_assignments_route(current_user, course_id: int):
    """
    Lists assignments for a specific course.
    If the user is a student, it checks enrollment.
    If the user is a teacher, it might bypass enrollment check (handled by controller/service).
    For now, primarily student-focused, using current_user.id for student enrollment check.
    """
    # The controller will use current_user.id to verify student enrollment.
    # If teachers also use this, controller logic might need adjustment or a separate teacher endpoint.
    response, status_code = assignment_controller.list_course_assignments_controller(
        current_student_id=current_user.id, # Assumes student context from jwt
        course_id=course_id
    )
    return jsonify(response), status_code

# POST /courses/<course_id>/assignments - Teacher creates an assignment for their course
@course_bp.route('/<int:course_id>/assignments', methods=['POST'])
@jwt_required
@roles_required(['teacher'])
def create_assignment_for_course_route(current_user, course_id: int):
    """
    Route for a teacher to create an assignment within one of their courses.
    """
    data = request.get_json()
    if not data:
        return jsonify({'message': 'Request body must be JSON'}), 400

    response, status_code = assignment_controller.create_assignment_controller(
        current_teacher_id=current_user.id,
        course_id=course_id,
        request_data=data
    )
    return jsonify(response), status_code


# Student enrollment route (could be a separate blueprint or handled by students themselves)
# For now, teacher enrolls student. If students self-enroll, this would change.
# @course_bp.route('/<int:course_id>/enroll', methods=['POST'])
# @jwt_required
# @roles_required(['student']) # Student self-enrollment
# def self_enroll_in_course(current_user, course_id: int):
#     # response, status_code = enrollment_controller.self_enroll_student_controller(current_user.id, course_id)
#     # return jsonify(response), status_code
#     return jsonify({"message": f"Endpoint for student {current_user.id} to self-enroll in course {course_id}"}), 200
