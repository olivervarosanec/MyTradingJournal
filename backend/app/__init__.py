from flask import Flask, request
from flask_sqlalchemy import SQLAlchemy
import os

# Initialize SQLAlchemy
db = SQLAlchemy()

_cors_missing = False
try:
    from flask_cors import CORS  # type: ignore
except ImportError:  # pragma: no cover - optional dependency
    CORS = None  # type: ignore
    _cors_missing = True


def create_app():
    # Create and configure the app
    app = Flask(__name__, instance_relative_config=True)

    if CORS:
        CORS(app)
    elif _cors_missing:
        app.logger.warning(
            "flask-cors not installed; continuing without it. Install via 'pip install flask-cors' to enable full CORS support."
        )

        @app.before_request
        def handle_preflight():
            if request.method == 'OPTIONS':
                response = app.make_default_options_response()
                response.headers['Access-Control-Allow-Origin'] = '*'
                response.headers['Access-Control-Allow-Headers'] = request.headers.get(
                    'Access-Control-Request-Headers', 'Content-Type,Authorization'
                )
                response.headers['Access-Control-Allow-Methods'] = request.headers.get(
                    'Access-Control-Request-Method', 'GET,POST,PUT,DELETE,OPTIONS'
                )
                return response

        @app.after_request
        def add_cors_headers(response):
            response.headers.setdefault('Access-Control-Allow-Origin', '*')
            response.headers.setdefault('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            response.headers.setdefault('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
            return response

    # Ensure the instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    # Configure the SQLite database
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(app.instance_path, 'trading_journal.sqlite')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize the app with the extension
    db.init_app(app)

    # Import and register blueprints
    from .routes import main_bp
    app.register_blueprint(main_bp)

    # Create database tables
    with app.app_context():
        db.create_all()

    return app