import os
import os
from flask import Flask
from dotenv import load_dotenv
from backend.src.extensions import db
from backend.src.routes.auth_routes import auth_bp
from backend.src.routes.user_routes import user_bp
from backend.src.routes.course_routes import course_bp
from backend.src.routes.assignment_routes import assignment_bp # Import the assignment blueprint
# Import models for db.create_all()
from backend.src.models.user_model import User
from backend.src.models.course_model import Course, Chapter, Enrollment
from backend.src.models.assignment_model import Assignment, Submission

# Load environment variables from .env file
load_dotenv()

def create_app(config_name='default'):
    """Application Factory Function"""
    app = Flask(__name__)

    # Configure database URI from environment variable, with a fallback
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///fallback_dev.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Configure SECRET_KEY from environment variable, with a default (ensure this is strong in production)
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'a_very_default_and_not_secure_secret_key')

    # Configure JWT token expiration (optional, defaults to 1 hour in security.py if not set)
    app.config['JWT_ACCESS_TOKEN_EXPIRES_HOURS'] = int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES_HOURS', 1))

    # Initialize extensions
    db.init_app(app)

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(course_bp)
    app.register_blueprint(assignment_bp) # Register the assignment blueprint

    # Basic "Hello World" route for testing
    @app.route('/')
    def hello_world():
        return 'Hello, World! EcoMonitor Pro Backend is running.'

    # Create database tables if they don't exist
    # This is suitable for development. For production, use migrations (e.g., Flask-Migrate).
    # Consider moving db.create_all() to a CLI command or a separate script for production.
    with app.app_context():
        db.create_all()

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
