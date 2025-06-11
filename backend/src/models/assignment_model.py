import enum
from backend.src.extensions import db
from backend.src.models.user_model import User
from backend.src.models.course_model import Course, Chapter
from sqlalchemy.sql import func
from sqlalchemy import UniqueConstraint

class SubmissionTypeEnum(enum.Enum):
    TEXT = "text"
    FILE_UPLOAD = "file_upload"
    URL = "url" # Added another common type

class Assignment(db.Model):
    __tablename__ = 'assignments'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    chapter_id = db.Column(db.Integer, db.ForeignKey('chapters.id'), nullable=True) # Optional link to a chapter
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    due_date = db.Column(db.TIMESTAMP, nullable=True)
    created_at = db.Column(db.TIMESTAMP, server_default=func.now())
    updated_at = db.Column(db.TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relationships
    course = db.relationship('Course', backref=db.backref('assignments', lazy='dynamic'))
    chapter = db.relationship('Chapter', backref=db.backref('assignments', lazy='dynamic')) # An assignment can optionally belong to a chapter
    submissions = db.relationship('Submission', backref='assignment', lazy='dynamic', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Assignment {self.id} "{self.title}" Course {self.course_id}>'

    def to_dict(self, include_course=False, include_chapter=False, include_submission_count=False):
        data = {
            'id': self.id,
            'course_id': self.course_id,
            'chapter_id': self.chapter_id,
            'title': self.title,
            'description': self.description,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_course and self.course:
            data['course'] = {'id': self.course.id, 'title': self.course.title} # Basic info
        if include_chapter and self.chapter:
            data['chapter'] = {'id': self.chapter.id, 'title': self.chapter.title} # Basic info
        if include_submission_count:
            data['submission_count'] = self.submissions.count() if self.submissions else 0
        return data

class Submission(db.Model):
    __tablename__ = 'submissions'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    assignment_id = db.Column(db.Integer, db.ForeignKey('assignments.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    submission_type = db.Column(db.Enum(SubmissionTypeEnum), nullable=False)
    content_text = db.Column(db.Text, nullable=True) # For text submissions
    file_url = db.Column(db.String(2048), nullable=True) # For file uploads or external URLs

    submitted_at = db.Column(db.TIMESTAMP, server_default=func.now())
    grade = db.Column(db.String(255), nullable=True) # e.g., "A+", "85/100", "Pass"
    feedback = db.Column(db.Text, nullable=True) # Teacher's feedback

    # Relationships
    # assignment backref is defined in Assignment.submissions
    student = db.relationship('User', backref=db.backref('submissions', lazy='dynamic'))

    # Constraints
    __table_args__ = (UniqueConstraint('assignment_id', 'student_id', name='uq_assignment_student_submission'),)

    def __repr__(self):
        return f'<Submission {self.id} for Assignment {self.assignment_id} by Student {self.student_id}>'

    def to_dict(self, include_student=True, include_assignment=False):
        data = {
            'id': self.id,
            'assignment_id': self.assignment_id,
            'student_id': self.student_id,
            'submission_type': self.submission_type.value if isinstance(self.submission_type, SubmissionTypeEnum) else str(self.submission_type),
            'content_text': self.content_text,
            'file_url': self.file_url,
            'submitted_at': self.submitted_at.isoformat() if self.submitted_at else None,
            'grade': self.grade,
            'feedback': self.feedback,
        }
        if include_student and self.student:
            data['student'] = {'id': self.student.id, 'username': self.student.username, 'email': self.student.email} # Basic student info
        if include_assignment and self.assignment:
            # Basic assignment info to avoid recursion if assignment includes submissions
            data['assignment'] = {'id': self.assignment.id, 'title': self.assignment.title}
        return data
