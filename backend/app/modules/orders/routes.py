from http import HTTPStatus

from flask import Blueprint

from app.core.utils.flask_api import api_response, get_request_db, parse_body
from app.modules.orders.schemas import OrderCreate, OrderRead
from app.modules.orders.services import OrderService

orders_bp = Blueprint("orders", __name__, url_prefix="/orders")


@orders_bp.post("")
def create_order():
    order = OrderService(get_request_db()).create_order(parse_body(OrderCreate))
    return api_response("Order created", OrderRead.model_validate(order), HTTPStatus.CREATED)


@orders_bp.get("")
def list_orders():
    orders = OrderService(get_request_db()).list_orders()
    return api_response("Orders retrieved", [OrderRead.model_validate(order) for order in orders])


@orders_bp.get("/<int:order_id>")
def get_order(order_id: int):
    order = OrderService(get_request_db()).get_order(order_id)
    return api_response("Order retrieved", OrderRead.model_validate(order))


@orders_bp.delete("/<int:order_id>")
def cancel_order(order_id: int):
    order = OrderService(get_request_db()).cancel_order(order_id)
    return api_response("Order cancelled", order)
