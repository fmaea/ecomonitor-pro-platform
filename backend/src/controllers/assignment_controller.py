from flask import jsonify
from backend.src.services import assignment_service
from backend.src.services.assignment_service import AssignmentServiceError
from backend.src.models.assignment_model import SubmissionTypeEnum # For type conversion

# --- Student-facing controllers ---

def list_course_assignments_controller(current_student_id: int, course_id: int):
    """
    Controller to list assignments for a specific course, for an enrolled student.
    """
    try:
        assignments = assignment_service.list_assignments_for_course(course_id, current_student_id)
        # `assignments` will be None if service layer determined not enrolled / not found
        # However, service now raises exceptions for these cases.
        assignments_data = [a.to_dict(include_submission_count=False) for a in assignments] # Basic assignment info
        return {'message': 'Assignments fetched successfully', 'assignments': assignments_data}, 200
    except AssignmentServiceError as e:
        return {'message': str(e)}, e.status_code
    except Exception as e:
        # Log e
        return {'message': f'An unexpected error occurred: {str(e)}'}, 500

def submit_assignment_controller(current_student_id: int, assignment_id: int, request_data: dict):
    """
    Controller for a student to submit an assignment.
    """
    if not request_data or 'submission_type' not in request_data:
        return {'message': 'submission_type is required.'}, 400

    submission_type_str = request_data.get('submission_type')
    try:
        submission_type_enum = SubmissionTypeEnum(submission_type_str) # Convert string to Enum
    except ValueError:
        valid_types = [e.value for e in SubmissionTypeEnum]
        return {'message': f"Invalid submission_type: '{submission_type_str}'. Must be one of {valid_types}."}, 400

    content_text = request_data.get('content_text')
    file_url = request_data.get('file_url') # Path to file or external URL

    # Basic validation based on type (service layer will also validate)
    if submission_type_enum == SubmissionTypeEnum.TEXT and not content_text:
        return {'message': 'content_text is required for TEXT submissions.'}, 400
    if (submission_type_enum == SubmissionTypeEnum.FILE_UPLOAD or submission_type_enum == SubmissionTypeEnum.URL) and not file_url:
        return {'message': 'file_url is required for FILE_UPLOAD or URL submissions.'}, 400

    try:
        submission = assignment_service.submit_assignment(
            student_id=current_student_id,
            assignment_id=assignment_id,
            submission_type=submission_type_enum,
            content_text=content_text,
            file_url=file_url
        )
        return {'message': 'Assignment submitted successfully', 'submission': submission.to_dict(include_student=False, include_assignment=True)}, 201
    except AssignmentServiceError as e:
        return {'message': str(e)}, e.status_code
    except Exception as e:
        # Log e
        return {'message': f'An unexpected error occurred: {str(e)}'}, 500

def get_my_submission_controller(current_student_id: int, assignment_id: int):
    """
    Controller for a student to retrieve their submission for a specific assignment.
    """
    try:
        submission = assignment_service.get_student_submission_for_assignment(current_student_id, assignment_id)
        if not submission:
            return {'message': 'Submission not found for this assignment.'}, 404
        # Include basic assignment info for context
        return {'message': 'Submission fetched successfully', 'submission': submission.to_dict(include_student=False, include_assignment=True)}, 200
    except AssignmentServiceError as e:
        return {'message': str(e)}, e.status_code
    except Exception as e:
        # Log e
        return {'message': f'An unexpected error occurred: {str(e)}'}, 500

# --- Teacher-facing controllers ---

def create_assignment_controller(current_teacher_id: int, course_id: int, request_data: dict):
    """
    Controller for a teacher to create an assignment for one of their courses.
    """
    if not request_data or not request_data.get('title'):
        return {'message': 'Title is required for an assignment.'}, 400

    # Add more validation as needed, e.g., for due_date format
    # due_date_str = request_data.get('due_date')
    # parsed_due_date = None
    # if due_date_str:
    #     try:
    #         # Example: parsed_due_date = datetime.fromisoformat(due_date_str)
    #         # Ensure it's timezone-aware if necessary
    #     except ValueError:
    #         return {'message': 'Invalid due_date format.'}, 400

    try:
        assignment = assignment_service.create_assignment_for_course(
            teacher_id=current_teacher_id,
            course_id=course_id,
            title=request_data['title'],
            description=request_data.get('description'),
            due_date=request_data.get('due_date'),
            chapter_id=request_data.get('chapter_id')
        )
        # include_submission_count useful for teacher viewing their assignments
        return {'message': 'Assignment created successfully', 'assignment': assignment.to_dict(include_submission_count=True, include_course=True)}, 201
    except AssignmentServiceError as e:
        return {'message': str(e)}, e.status_code
    except Exception as e:
        # Log e
        return {'message': f'An unexpected error occurred while creating assignment: {str(e)}'}, 500

def list_submissions_for_assignment_controller(current_teacher_id: int, assignment_id: int):
    """
    Controller for a teacher to list all submissions for a specific assignment they manage.
    """
    try:
        submissions = assignment_service.get_submissions_for_assignment(current_teacher_id, assignment_id)
        # Include student info for each submission, and basic assignment info for context
        submissions_data = [s.to_dict(include_student=True, include_assignment=False) for s in submissions]
        return {'message': 'Submissions fetched successfully', 'submissions': submissions_data}, 200
    except AssignmentServiceError as e:
        return {'message': str(e)}, e.status_code
    except Exception as e:
        # Log e
        return {'message': f'An unexpected error occurred while fetching submissions: {str(e)}'}, 500

def grade_submission_controller(current_teacher_id: int, submission_id: int, request_data: dict):
    """
    Controller for a teacher to grade a student's submission.
    """
    if not request_data or 'grade' not in request_data:
        return {'message': 'Grade is required in the request data.'}, 400

    try:
        submission = assignment_service.grade_submission(
            teacher_id=current_teacher_id,
            submission_id=submission_id,
            grade=request_data['grade'],
            feedback=request_data.get('feedback')
        )
        # Include student and assignment info for context in response
        return {'message': 'Submission graded successfully', 'submission': submission.to_dict(include_student=True, include_assignment=True)}, 200
    except AssignmentServiceError as e:
        return {'message': str(e)}, e.status_code
    except Exception as e:
        # Log e
        return {'message': f'An unexpected error occurred while grading: {str(e)}'}, 500
