from flask import jsonify
from backend.src.services import course_service
from backend.src.services.course_service import CourseServiceError

def list_my_courses_controller(current_student_id: int):
    """
    Controller to list courses the current student is enrolled in.
    """
    try:
        courses = course_service.get_enrolled_courses_for_student(current_student_id)
        # Serialize: include teacher, but not chapters or enrolled count for summary list
        courses_data = [course.to_dict(include_chapters=False, include_teacher=True, include_enrolled_count=False) for course in courses]
        return {'message': 'Enrolled courses fetched successfully', 'courses': courses_data}, 200
    except CourseServiceError as e:
        return {'message': str(e)}, e.status_code
    except Exception as e:
        # Log the exception e
        return {'message': f'An unexpected error occurred: {str(e)}'}, 500

def get_my_course_details_controller(current_student_id: int, course_id: int):
    """
    Controller to get detailed information about a specific course the student is enrolled in.
    Includes chapters.
    """
    try:
        course = course_service.get_course_details_for_student(current_student_id, course_id)
        if not course:
            # This means student is not enrolled, or course doesn't exist.
            # Service returns None in this case.
            # Check if course exists at all to give a more specific error
            exists = course_service.get_course_by_id(course_id) is not None
            if not exists:
                return {'message': 'Course not found'}, 404
            return {'message': 'Access denied: You are not enrolled in this course, or the course was not found for you.'}, 403

        # Serialize: include chapters and teacher details
        course_data = course.to_dict(include_chapters=True, include_teacher=True, include_enrolled_count=True)
        return {'message': 'Course details fetched successfully', 'course': course_data}, 200
    except CourseServiceError as e:
        return {'message': str(e)}, e.status_code
    except Exception as e:
        # Log the exception e
        return {'message': f'An unexpected error occurred: {str(e)}'}, 500

def list_all_public_courses_controller():
    """
    Controller to list all available courses (publicly or for logged-in users).
    Does not require enrollment.
    """
    try:
        courses = course_service.get_all_courses()
        # Serialize: include teacher, optionally enrolled count, but not chapters for summary
        courses_data = [course.to_dict(include_chapters=False, include_teacher=True, include_enrolled_count=True) for course in courses]
        return {'message': 'All courses fetched successfully', 'courses': courses_data}, 200
    except Exception as e:
        # Log the exception e
        return {'message': f'An unexpected error occurred: {str(e)}'}, 500

def get_public_course_details_controller(course_id: int):
    """
    Controller to get detailed information about a specific course (publicly or for logged-in users).
    Does not require enrollment. Includes chapters.
    """
    try:
        course = course_service.get_course_by_id(course_id) # This fetches with chapters and teacher
        if not course:
            return {'message': 'Course not found'}, 404

        # Serialize: include chapters and teacher details, optionally enrolled count
        course_data = course.to_dict(include_chapters=True, include_teacher=True, include_enrolled_count=True)
        return {'message': 'Course details fetched successfully', 'course': course_data}, 200
    except Exception as e:
        # Log the exception e
        return {'message': f'An unexpected error occurred: {str(e)}'}, 500

def get_course_chapters_controller(course_id: int, current_user_id: int | None = None):
    """
    Controller to get chapters for a course.
    If current_user_id is provided, it verifies enrollment.
    """
    try:
        # If current_user_id is provided, service will check enrollment
        chapters = course_service.get_course_chapters(course_id, student_id=current_user_id)

        if chapters is None: # Service returns None if course not found or user not enrolled
            # Distinguish between course not found and not enrolled
            course_exists = course_service.get_course_by_id(course_id) is not None
            if not course_exists:
                 return {'message': 'Course not found'}, 404
            if current_user_id and not course_service.is_student_enrolled(current_user_id, course_id):
                 return {'message': 'Access denied: You are not enrolled in this course.'}, 403
            # If chapters is None for other reasons (e.g. course exists but has no chapters, though service returns list)
            return {'message': 'Chapters not found or access denied.'}, 404


        chapters_data = [chapter.to_dict() for chapter in chapters]
        return {'message': 'Chapters fetched successfully', 'chapters': chapters_data}, 200
    except CourseServiceError as e:
        return {'message': str(e)}, e.status_code
    except Exception as e:
        return {'message': f'An unexpected error occurred: {str(e)}'}, 500

# --- Teacher specific controllers ---

def create_new_course_controller(current_teacher_id: int, request_data: dict):
    """
    Controller for a teacher to create a new course.
    """
    if not request_data or not request_data.get('title'):
        return {'message': 'Title is required to create a course.'}, 400

    title = request_data['title']
    description = request_data.get('description')

    try:
        new_course = course_service.create_course(
            teacher_id=current_teacher_id,
            title=title,
            description=description
        )
        # Serialize: include teacher, no chapters initially, no enrolled count
        return {'message': 'Course created successfully', 'course': new_course.to_dict(include_chapters=False, include_teacher=True, include_enrolled_count=False)}, 201
    except CourseServiceError as e:
        return {'message': str(e)}, e.status_code
    except Exception as e:
        # Log e
        return {'message': f'An unexpected error occurred: {str(e)}'}, 500

def add_chapter_controller(current_teacher_id: int, course_id: int, request_data: dict):
    """
    Controller for a teacher to add a chapter to their course.
    """
    required_fields = ['title', 'content', 'order']
    if not request_data or not all(field in request_data for field in required_fields):
        return {'message': f'Missing required fields: {", ".join(required_fields)}'}, 400

    try:
        new_chapter = course_service.add_chapter_to_course(
            course_id=course_id,
            teacher_id=current_teacher_id,
            title=request_data['title'],
            content=request_data['content'],
            order=request_data['order']
        )
        if not new_chapter: # Should be caught by CourseServiceError now
             return {'message': 'Failed to add chapter. Course not found or not owned by you.'}, 403 # or 404
        return {'message': 'Chapter added successfully', 'chapter': new_chapter.to_dict()}, 201
    except CourseServiceError as e: # Service layer raises this for auth/not found issues
        return {'message': str(e)}, e.status_code
    except Exception as e:
        # Log e
        return {'message': f'An unexpected error occurred: {str(e)}'}, 500

def enroll_student_controller(current_teacher_id: int, course_id: int, request_data: dict):
    """
    Controller for a teacher to enroll a student in their course.
    """
    if not request_data or 'student_id' not in request_data:
        return {'message': 'student_id is required in the request body.'}, 400

    student_id = request_data['student_id']
    if not isinstance(student_id, int):
        return {'message': 'student_id must be an integer.'}, 400

    try:
        result = course_service.enroll_student_in_course(
            course_id=course_id,
            student_id=student_id,
            requesting_teacher_id=current_teacher_id
        )
        if isinstance(result, str): # Service returns a message if already enrolled
            return {'message': result}, 200 # Or 409 Conflict if preferred

        # Successfully enrolled
        return {'message': 'Student enrolled successfully', 'enrollment': result.to_dict()}, 201
    except CourseServiceError as e:
        return {'message': str(e)}, e.status_code
    except Exception as e:
        # Log e
        return {'message': f'An unexpected error occurred: {str(e)}'}, 500

def list_my_taught_courses_controller(current_teacher_id: int):
    """
    Controller for a teacher to list courses they teach.
    """
    try:
        courses = course_service.get_courses_taught_by_teacher(current_teacher_id)
        # Serialize: include teacher (self), optionally chapters, optionally enrolled count
        courses_data = [course.to_dict(include_chapters=True, include_teacher=True, include_enrolled_count=True) for course in courses]
        return {'message': 'Your taught courses fetched successfully', 'courses': courses_data}, 200
    except CourseServiceError as e: # Should not happen if teacher_id is from JWT
        return {'message': str(e)}, e.status_code
    except Exception as e:
        # Log e
        return {'message': f'An unexpected error occurred: {str(e)}'}, 500

def list_enrolled_students_in_course_controller(current_teacher_id: int, course_id: int):
    """
    Controller for a teacher to list students enrolled in one of their courses.
    """
    try:
        students = course_service.get_students_enrolled_in_course(course_id, current_teacher_id)
        students_data = [student.to_dict() for student in students] # User.to_dict()
        return {'message': 'Students enrolled in course fetched successfully', 'students': students_data}, 200
    except CourseServiceError as e:
        return {'message': str(e)}, e.status_code
    except Exception as e:
        # Log e
        return {'message': f'An unexpected error occurred: {str(e)}'}, 500
