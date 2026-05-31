from http import HTTPStatus
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions.handlers import AppError
from app.database.models.customer import Customer
from app.modules.customers.repositories import CustomerRepository
from app.modules.customers.schemas import CustomerCreate


class CustomerService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = CustomerRepository(db)

    def list_customers(self) -> list[Customer]:
        return self.repo.list()

    def get_customer(self, customer_id: int) -> Customer:
        customer = self.repo.get(customer_id)
        if not customer:
            raise AppError("Customer not found", HTTPStatus.NOT_FOUND)
        return customer

    def create_customer(self, payload: CustomerCreate) -> Customer:
        if self.repo.get_by_email(payload.email):
            raise AppError("Customer email already exists", HTTPStatus.CONFLICT)
        customer = self.repo.create(payload)
        try:
            self.db.commit()
            self.db.refresh(customer)
            return customer
        except IntegrityError as exc:
            self.db.rollback()
            raise AppError("Customer could not be saved", HTTPStatus.CONFLICT) from exc

    def delete_customer(self, customer_id: int) -> None:
        customer = self.get_customer(customer_id)
        self.repo.delete(customer)
        try:
            self.db.commit()
        except IntegrityError as exc:
            self.db.rollback()
            raise AppError(
                "Customer cannot be deleted because it is referenced by order history",
                HTTPStatus.CONFLICT,
            ) from exc
