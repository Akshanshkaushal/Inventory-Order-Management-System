from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models.customer import Customer
from app.modules.customers.schemas import CustomerCreate


class CustomerRepository:
    def __init__(self, db: Session):
        self.db = db

    def list(self) -> list[Customer]:
        return list(self.db.scalars(select(Customer).order_by(Customer.created_at.desc())))

    def get(self, customer_id: int) -> Customer | None:
        return self.db.get(Customer, customer_id)

    def get_by_email(self, email: str) -> Customer | None:
        return self.db.scalar(select(Customer).where(Customer.email == email))

    def create(self, payload: CustomerCreate) -> Customer:
        customer = Customer(**payload.model_dump())
        self.db.add(customer)
        return customer

    def delete(self, customer: Customer) -> None:
        self.db.delete(customer)

