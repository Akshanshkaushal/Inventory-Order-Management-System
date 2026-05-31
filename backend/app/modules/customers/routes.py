from http import HTTPStatus

from flask import Blueprint

from app.core.utils.flask_api import api_response, get_request_db, parse_body
from app.modules.customers.schemas import CustomerCreate, CustomerRead
from app.modules.customers.services import CustomerService

customers_bp = Blueprint("customers", __name__, url_prefix="/customers")


@customers_bp.post("")
def create_customer():
    customer = CustomerService(get_request_db()).create_customer(parse_body(CustomerCreate))
    return api_response("Customer created", CustomerRead.model_validate(customer), HTTPStatus.CREATED)


@customers_bp.get("")
def list_customers():
    customers = CustomerService(get_request_db()).list_customers()
    return api_response("Customers retrieved", [CustomerRead.model_validate(customer) for customer in customers])


@customers_bp.get("/<int:customer_id>")
def get_customer(customer_id: int):
    customer = CustomerService(get_request_db()).get_customer(customer_id)
    return api_response("Customer retrieved", CustomerRead.model_validate(customer))


@customers_bp.delete("/<int:customer_id>")
def delete_customer(customer_id: int):
    CustomerService(get_request_db()).delete_customer(customer_id)
    return api_response("Customer deleted", {"id": customer_id})
