from backend.src.models import Course, Chapter, Enrollment, User
from backend.src.extensions import db
from sqlalchemy.orm import joinedload

class CourseServiceError(Exception):
    """Custom exception for course service errors."""
    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.status_code = status_code

def get_all_courses() -> list[Course]:
    """
    Returns a list of all courses.
    Consider pagination for large numbers of courses.
    """
    return Course.query.order_by(Course.created_at.desc()).all()

def get_course_by_id(course_id: int) -> Course | None:
    """
    Fetches a single course by its ID, including its chapters and teacher info.
    """
    return Course.query.options(
        joinedload(Course.chapters),
        joinedload(Course.teacher) # Assuming 'teacher' is the relationship attribute
    ).get(course_id)

def get_enrolled_courses_for_student(student_id: int) -> list[Course]:
    """
    Retrieves all courses a student is enrolled in.
    """
    # This uses the many-to-many relationship defined in Course model
    student = User.query.get(student_id)
    if not student:
        raise CourseServiceError("Student not found", 404)
    return student.enrolled_courses.order_by(Course.title).all()


def get_course_details_for_student(student_id: int, course_id: int) -> Course | None:
    """
    Retrieves details for a specific course if the student is enrolled in it.
    Includes chapters.
    """
    # Check enrollment first using the Enrollment model or the association
    is_enrolled = db.session.query(Enrollment.id).\
        filter_by(student_id=student_id, course_id=course_id).first() is not None

    # Alternative using the relationship on User model (if available and preferred)
    # student = User.query.get(student_id)
    # if not student:
    #     raise CourseServiceError("Student not found", 404)
    # course = student.enrolled_courses.filter_by(id=course_id).first()
    # if not course:
    #     return None # Student is not enrolled or course doesn't exist

    if not is_enrolled:
        # You could raise an error here to be handled by the controller
        # For now, returning None, controller will decide 403 vs 404
        return None

    # If enrolled, fetch the course with its chapters
    # The options(joinedload(Course.chapters)) ensures chapters are loaded efficiently.
    course = Course.query.options(
        joinedload(Course.chapters),
        joinedload(Course.teacher) # Also load teacher info
        ).get(course_id)
    return course


def get_course_chapters(course_id: int, student_id: int | None = None) -> list[Chapter] | None:
    """
    Retrieves all chapters for a specific course, ordered by 'order'.
    If student_id is provided, it first checks if the student is enrolled.
    """
    course = Course.query.get(course_id)
    if not course:
        return None # Course not found

    if student_id: # If student_id is passed, verify enrollment
        is_enrolled = db.session.query(Enrollment.id).\
            filter_by(student_id=student_id, course_id=course_id).first() is not None
        if not is_enrolled:
            # Consider raising an exception or returning an empty list with a specific status
            # For now, returning None, controller can interpret as not authorized or not found
            return None

    return Chapter.query.filter_by(course_id=course_id).order_by(Chapter.order.asc()).all()


def is_student_enrolled(student_id: int, course_id: int) -> bool:
    """
    Checks if a student is enrolled in a specific course.
    """
    return db.session.query(Enrollment.id).\
        filter_by(student_id=student_id, course_id=course_id).first() is not None

# --- Teacher specific services ---
def create_course(teacher_id: int, title: str, description: str | None = None) -> Course:
    """
    Creates a new course by a teacher.
    Assumes teacher_id is validated (e.g., user exists and has 'teacher' role by decorator).
    """
    # Double check teacher role, though decorator should handle it.
    # teacher = User.query.get(teacher_id)
    # if not teacher or teacher.role != RoleEnum.TEACHER: # Use RoleEnum
    #     raise CourseServiceError("User is not authorized to create courses.", 403)

    new_course = Course(title=title, description=description, teacher_id=teacher_id)
    db.session.add(new_course)
    db.session.commit()
    return new_course

def add_chapter_to_course(course_id: int, teacher_id: int, title: str, content: str, order: int) -> Chapter | None:
    """
    Adds a chapter to a course if the course is taught by the given teacher.
    """
    course = Course.query.filter_by(id=course_id, teacher_id=teacher_id).first()
    if not course:
        # Course doesn't exist or isn't taught by this teacher.
        # Controller should distinguish between 404 and 403 if needed.
        raise CourseServiceError("Course not found or you are not the teacher of this course.", 404) # Or 403

    new_chapter = Chapter(course_id=course_id, title=title, content=content, order=order)
    db.session.add(new_chapter)
    db.session.commit()
    return new_chapter

def enroll_student_in_course(course_id: int, student_id: int, requesting_teacher_id: int) -> Enrollment | str:
    """
    Enrolls a student in a course, typically initiated by a teacher of that course.
    Returns the Enrollment object or a message string if already enrolled or error.
    """
    course = Course.query.filter_by(id=course_id, teacher_id=requesting_teacher_id).first()
    if not course:
        raise CourseServiceError("Course not found or you are not authorized to manage enrollments for this course.", 403)

    student = User.query.get(student_id)
    if not student:
        raise CourseServiceError(f"Student with ID {student_id} not found.", 404)

    if student.role.value != 'student': # Compare Enum member's value
        raise CourseServiceError(f"User {student.username} (ID: {student_id}) is not a student and cannot be enrolled.", 400)

    existing_enrollment = Enrollment.query.filter_by(student_id=student_id, course_id=course_id).first()
    if existing_enrollment:
        return "Student is already enrolled in this course."

    new_enrollment = Enrollment(student_id=student_id, course_id=course_id)
    db.session.add(new_enrollment)
    db.session.commit()
    return new_enrollment

def get_courses_taught_by_teacher(teacher_id: int) -> list[Course]:
    """
    Retrieves all courses taught by a specific teacher.
    """
    # Assumes teacher_id is validated (user exists and is a teacher).
    # The backref 'taught_courses' on the User model could also be used if preferred:
    # teacher = User.query.get(teacher_id)
    # if not teacher or teacher.role != RoleEnum.TEACHER:
    #     raise CourseServiceError("Teacher not found or user is not a teacher.", 404)
    # return teacher.taught_courses.order_by(Course.title).all()

    return Course.query.filter_by(teacher_id=teacher_id).order_by(Course.title).all()

def get_students_enrolled_in_course(course_id: int, teacher_id: int) -> list[User]:
    """
    Retrieves a list of students enrolled in a specific course taught by the teacher.
    """
    course = Course.query.filter_by(id=course_id, teacher_id=teacher_id).first()
    if not course:
        raise CourseServiceError("Course not found or you are not the teacher of this course.", 403) # or 404

    # Using the Course.enrolled_students relationship
    return course.enrolled_students.order_by(User.username).all()
