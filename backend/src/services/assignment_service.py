from backend.src.models import Assignment, Submission, SubmissionTypeEnum, Enrollment, User, Course
from backend.src.extensions import db
from backend.src.services.course_service import CourseServiceError # Re-using for consistency or define a generic ServiceError
from sqlalchemy.exc import IntegrityError

class AssignmentServiceError(Exception):
    """Custom exception for assignment service errors."""
    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.status_code = status_code

# --- Student-facing services ---

def list_assignments_for_course(course_id: int, student_id: int) -> list[Assignment] | None:
    """
    Lists all assignments for a given course if the student is enrolled.
    Returns None if student is not enrolled or course does not exist.
    """
    # Verify student enrollment
    enrollment = Enrollment.query.filter_by(student_id=student_id, course_id=course_id).first()
    if not enrollment:
        # Check if course exists to differentiate error
        course_exists = Course.query.get(course_id) is not None
        if not course_exists:
            raise AssignmentServiceError(f"Course with ID {course_id} not found.", 404)
        raise AssignmentServiceError("You are not enrolled in this course.", 403)

    return Assignment.query.filter_by(course_id=course_id).order_by(Assignment.due_date.asc()).all()

def submit_assignment(student_id: int, assignment_id: int, submission_type: SubmissionTypeEnum, content_text: str = None, file_url: str = None) -> Submission:
    """
    Submits an assignment for a student.
    Prevents re-submission if one already exists.
    """
    assignment = Assignment.query.get(assignment_id)
    if not assignment:
        raise AssignmentServiceError(f"Assignment with ID {assignment_id} not found.", 404)

    # Verify student is enrolled in the course of the assignment
    is_enrolled = Enrollment.query.filter_by(student_id=student_id, course_id=assignment.course_id).first()
    if not is_enrolled:
        raise AssignmentServiceError("You are not enrolled in the course for this assignment.", 403)

    # Check for existing submission
    existing_submission = Submission.query.filter_by(student_id=student_id, assignment_id=assignment_id).first()
    if existing_submission:
        raise AssignmentServiceError("You have already submitted this assignment.", 409) # 409 Conflict

    # Validate submission content based on type
    if submission_type == SubmissionTypeEnum.TEXT and not content_text:
        raise AssignmentServiceError("Content text is required for text submissions.", 400)
    if submission_type == SubmissionTypeEnum.FILE_UPLOAD and not file_url: # Assuming file_url will store the path/URL to the uploaded file
        raise AssignmentServiceError("File URL is required for file upload submissions.", 400)
    if submission_type == SubmissionTypeEnum.URL and not file_url: # URL type submission using file_url field
         raise AssignmentServiceError("URL is required for URL submissions.", 400)


    new_submission = Submission(
        student_id=student_id,
        assignment_id=assignment_id,
        submission_type=submission_type,
        content_text=content_text,
        file_url=file_url
    )

    try:
        db.session.add(new_submission)
        db.session.commit()
    except IntegrityError: # Catches DB-level unique constraint violations if any slip through
        db.session.rollback()
        raise AssignmentServiceError("Submission failed due to a database conflict. You might have already submitted.", 409)
    except Exception as e:
        db.session.rollback()
        # Log e
        raise AssignmentServiceError(f"An unexpected error occurred during submission: {str(e)}", 500)

    return new_submission

def get_student_submission_for_assignment(student_id: int, assignment_id: int) -> Submission | None:
    """
    Retrieves a student's submission for a specific assignment.
    """
    # Optionally, verify assignment exists and student is enrolled in its course first.
    assignment = Assignment.query.get(assignment_id)
    if not assignment:
         raise AssignmentServiceError(f"Assignment with ID {assignment_id} not found.", 404)

    is_enrolled = Enrollment.query.filter_by(student_id=student_id, course_id=assignment.course_id).first()
    if not is_enrolled:
        raise AssignmentServiceError("You are not enrolled in the course for this assignment, hence cannot view submissions.", 403)

    return Submission.query.filter_by(student_id=student_id, assignment_id=assignment_id).first()


# --- Teacher-facing services ---

def create_assignment_for_course(teacher_id: int, course_id: int, title: str, description: str | None = None, due_date=None, chapter_id: int | None = None) -> Assignment:
    """
    Creates an assignment for a course, by the course teacher.
    """
    course = Course.query.filter_by(id=course_id, teacher_id=teacher_id).first()
    if not course:
        # This error message is more specific for the teacher creating the assignment.
        raise AssignmentServiceError("Course not found or you are not the teacher of this course, so you cannot add assignments to it.", 403)

    if chapter_id: # if chapter_id is provided, ensure it belongs to the course
        chapter = Chapter.query.filter_by(id=chapter_id, course_id=course_id).first()
        if not chapter:
            raise AssignmentServiceError(f"Chapter with ID {chapter_id} not found in course {course_id}.", 400)

    new_assignment = Assignment(
        course_id=course_id,
        chapter_id=chapter_id,
        title=title,
        description=description,
        due_date=due_date # Consider date parsing/validation if it's a string
    )
    db.session.add(new_assignment)
    db.session.commit()
    return new_assignment

def get_submissions_for_assignment(teacher_id: int, assignment_id: int) -> list[Submission]:
    """
    Retrieves all submissions for a given assignment, if the assignment belongs to a course taught by teacher_id.
    """
    assignment = Assignment.query.get(assignment_id)
    if not assignment:
        raise AssignmentServiceError(f"Assignment with ID {assignment_id} not found.", 404)

    # Verify teacher owns the course of this assignment
    if assignment.course.teacher_id != teacher_id:
        raise AssignmentServiceError("You are not authorized to view submissions for this assignment as you do not teach the course it belongs to.", 403)

    return Submission.query.filter_by(assignment_id=assignment_id).order_by(Submission.submitted_at.asc()).all()

def grade_submission(teacher_id: int, submission_id: int, grade: str, feedback: str | None = None) -> Submission:
    """
    Grades a submission. The submission must belong to an assignment in a course taught by the teacher.
    """
    submission = Submission.query.options(
        db.joinedload(Submission.assignment).joinedload(Assignment.course) # Eager load for auth check
    ).get(submission_id)

    if not submission:
        raise AssignmentServiceError(f"Submission with ID {submission_id} not found.", 404)

    # Verify teacher owns the course of this submission's assignment
    if submission.assignment.course.teacher_id != teacher_id:
        raise AssignmentServiceError("You are not authorized to grade this submission as you do not teach the course it belongs to.", 403)

    submission.grade = grade
    submission.feedback = feedback
    db.session.commit()
    return submission
