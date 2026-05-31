from http import HTTPStatus

from flask import Blueprint, request

from app.core.exceptions.handlers import AppError
from app.core.utils.flask_api import api_response, get_request_db, parse_body
from app.modules.products.schemas import ProductCreate, ProductRead, ProductUpdate
from app.modules.products.services import ProductService

products_bp = Blueprint("products", __name__, url_prefix="/products")


@products_bp.post("")
def create_product():
    product = ProductService(get_request_db()).create_product(parse_body(ProductCreate))
    return api_response("Product created", ProductRead.model_validate(product), HTTPStatus.CREATED)


@products_bp.get("")
def list_products():
    search = request.args.get("search")
    skip = _query_int("skip", default=0, minimum=0)
    limit = _query_int("limit", default=50, minimum=1, maximum=100)
    products = ProductService(get_request_db()).list_products(search=search, skip=skip, limit=limit)
    return api_response("Products retrieved", [ProductRead.model_validate(product) for product in products])


@products_bp.get("/<int:product_id>")
def get_product(product_id: int):
    product = ProductService(get_request_db()).get_product(product_id)
    return api_response("Product retrieved", ProductRead.model_validate(product))


@products_bp.put("/<int:product_id>")
def update_product(product_id: int):
    product = ProductService(get_request_db()).update_product(product_id, parse_body(ProductUpdate))
    return api_response("Product updated", ProductRead.model_validate(product))


@products_bp.delete("/<int:product_id>")
def delete_product(product_id: int):
    ProductService(get_request_db()).delete_product(product_id)
    return api_response("Product deleted", {"id": product_id})


def _query_int(name: str, default: int, minimum: int, maximum: int | None = None) -> int:
    raw = request.args.get(name)
    if raw is None:
        return default
    try:
        value = int(raw)
    except ValueError as exc:
        raise AppError(f"{name} must be an integer", HTTPStatus.UNPROCESSABLE_ENTITY) from exc
    if value < minimum or (maximum is not None and value > maximum):
        raise AppError(f"{name} is outside the allowed range", HTTPStatus.UNPROCESSABLE_ENTITY)
    return value
