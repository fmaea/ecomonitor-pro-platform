from backend.src.extensions import db
from backend.src.models.user_model import User # Import User for relationships
from sqlalchemy.sql import func
from sqlalchemy import UniqueConstraint

# Association table for student enrollments
enrollments_table = db.Table('enrollments_secondary', # Using a different name to avoid conflict with Enrollment model if it also creates a table named 'enrollments'
    db.Column('student_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('course_id', db.Integer, db.ForeignKey('courses.id'), primary_key=True),
    db.Column('enrolled_at', db.TIMESTAMP, server_default=func.now())
)

class Course(db.Model):
    __tablename__ = 'courses'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    teacher_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.TIMESTAMP, server_default=func.now())
    updated_at = db.Column(db.TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relationship to the User who is the teacher
    teacher = db.relationship('User', backref=db.backref('taught_courses', lazy='dynamic'))

    # Relationship to Chapters
    chapters = db.relationship('Chapter', backref='course', lazy='dynamic', cascade='all, delete-orphan')

    # Many-to-many relationship for students enrolled in the course
    # This uses the enrollments_table defined above
    enrolled_students = db.relationship('User', secondary=enrollments_table, lazy='dynamic',
                                        backref=db.backref('enrolled_courses', lazy='dynamic'))

    def __repr__(self):
        return f'<Course {self.title}>'

    def to_dict(self, include_chapters=True, include_teacher=True, include_enrolled_count=False):
        data = {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'teacher_id': self.teacher_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_teacher and self.teacher:
            # Embeds teacher's public profile using User.to_dict()
            data['teacher'] = self.teacher.to_dict()
        if include_chapters:
            # Sort chapters by order before serializing
            chapters_query = self.chapters.order_by(Chapter.order.asc()) if self.chapters else []
            data['chapters'] = [chapter.to_dict() for chapter in chapters_query]
        if include_enrolled_count:
            # Efficiently count enrolled students if the relationship is dynamic
            if hasattr(self.enrolled_students, 'count'): # For dynamic relationships
                 data['enrolled_students_count'] = self.enrolled_students.count()
            else: # For non-dynamic or if already loaded
                 data['enrolled_students_count'] = len(self.enrolled_students) if self.enrolled_students else 0

        # Note: including full enrolled_students list directly can be large and cause recursion.
        # It's better to have a separate endpoint for listing students in a course.
        return data

class Chapter(db.Model):
    __tablename__ = 'chapters'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=True) # E.g., Markdown, HTML, or reference to video
    order = db.Column(db.Integer, nullable=False) # Order of the chapter within the course
    created_at = db.Column(db.TIMESTAMP, server_default=func.now())
    updated_at = db.Column(db.TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # course backref is implicitly created by Course.chapters relationship

    def __repr__(self):
        return f'<Chapter {self.title} - Course {self.course_id}>'

    def to_dict(self, include_course_info=False):
        data = {
            'id': self.id,
            'course_id': self.course_id, # Keep course_id for reference
            'title': self.title,
            'content': self.content,
            'order': self.order,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_course_info and self.course:
            # Avoid full course serialization to prevent recursion if course includes chapters.
            data['course'] = {
                'id': self.course.id,
                'title': self.course.title
            }
        return data

class Enrollment(db.Model):
    __tablename__ = 'enrollments' # This is the explicit Enrollment model as requested

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    enrolled_at = db.Column(db.TIMESTAMP, server_default=func.now(), nullable=False)

    # Define a unique constraint for student_id and course_id
    __table_args__ = (UniqueConstraint('student_id', 'course_id', name='_student_course_uc'),)

    # Relationships to User (student) and Course
    student = db.relationship('User', backref=db.backref('enrollment_records', lazy='dynamic'))
    course = db.relationship('Course', backref=db.backref('enrollment_records', lazy='dynamic'))


    def __repr__(self):
        return f'<Enrollment student_id={self.student_id} course_id={self.course_id}>'

    def to_dict(self):
        data = {
            'id': self.id,
            'student_id': self.student_id,
            'course_id': self.course_id,
            'enrolled_at': self.enrolled_at.isoformat() if self.enrolled_at else None,
        }
        # Optionally include student and course details (be careful of circular refs if too deep)
        # if self.student:
        #     data['student'] = self.student.to_dict() # Basic user info
        # if self.course:
        #     data['course'] = {'id': self.course.id, 'title': self.course.title} # Basic course info
        return data
