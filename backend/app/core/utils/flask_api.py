from flask import current_app, g, jsonify, request
from pydantic import BaseModel, ValidationError

from app.database.session import SessionLocal


def get_request_db():
    test_session = current_app.config.get("TEST_DB_SESSION")
    if test_session is not None:
        return test_session

    if "db" not in g:
        g.db = SessionLocal()
    return g.db


def close_request_db(_: Exception | None = None) -> None:
    db = g.pop("db", None)
    if db is not None:
        db.close()


def parse_body(schema: type[BaseModel]) -> BaseModel:
    payload = request.get_json(silent=True)
    if payload is None:
        raise ValidationError.from_exception_data(
            schema.__name__,
            [{"type": "model_type", "loc": (), "msg": "Request body must be a JSON object", "input": payload}],
        )
    return schema.model_validate(payload)


def serialize(value):
    if isinstance(value, BaseModel):
        return value.model_dump(mode="json")
    if isinstance(value, list):
        return [serialize(item) for item in value]
    if value is None or isinstance(value, (str, int, float, bool, dict)):
        return value
    model = getattr(value, "__pydantic_serializer__", None)
    if model:
        return value.model_dump(mode="json")
    return value


def api_response(message: str, data=None, status_code: int = 200):
    response = jsonify({"success": True, "message": message, "data": serialize(data)})
    response.status_code = status_code
    return response
