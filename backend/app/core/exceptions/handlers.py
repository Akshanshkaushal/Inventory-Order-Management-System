import logging
from typing import Any

from flask import Flask, jsonify
from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError
from werkzeug.exceptions import HTTPException

logger = logging.getLogger(__name__)


class AppError(Exception):
    def __init__(self, message: str, status_code: int = 400, errors: list[Any] | None = None):
        self.message = message
        self.status_code = status_code
        self.errors = errors or []
        super().__init__(message)


def error_response(message: str, status_code: int, errors: list[Any] | None = None):
    response = jsonify({"success": False, "message": message, "errors": errors or []})
    response.status_code = int(status_code)
    return response


def register_exception_handlers(app: Flask) -> None:
    @app.errorhandler(AppError)
    def app_error_handler(exc: AppError):
        logger.info("Application error: %s", exc.message)
        return error_response(exc.message, exc.status_code, exc.errors)

    @app.errorhandler(ValidationError)
    def validation_error_handler(exc: ValidationError):
        logger.info("Validation error: %s", exc.errors())
        return error_response("Validation failed", 422, exc.errors())

    @app.errorhandler(IntegrityError)
    def integrity_error_handler(exc: IntegrityError):
        logger.exception("Database integrity error")
        detail = str(exc.orig) if getattr(exc, "orig", None) else "Integrity constraint failed"
        return error_response("Database constraint violation", 409, [{"detail": detail}])

    @app.errorhandler(HTTPException)
    def http_error_handler(exc: HTTPException):
        return error_response(exc.description or exc.name, exc.code or 500)

    @app.errorhandler(Exception)
    def unhandled_error_handler(exc: Exception):
        logger.exception("Unhandled exception: %s", exc)
        return error_response("Internal server error", 500)
