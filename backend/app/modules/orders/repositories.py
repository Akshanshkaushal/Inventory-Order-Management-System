from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database.models.order import Order, OrderItem


class OrderRepository:
    def __init__(self, db: Session):
        self.db = db

    def list(self) -> list[Order]:
        statement = (
            select(Order)
            .options(selectinload(Order.customer), selectinload(Order.items).selectinload(OrderItem.product))
            .order_by(Order.created_at.desc())
        )
        return list(self.db.scalars(statement))

    def get(self, order_id: int) -> Order | None:
        statement = (
            select(Order)
            .where(Order.id == order_id)
            .options(selectinload(Order.customer), selectinload(Order.items).selectinload(OrderItem.product))
        )
        return self.db.scalar(statement)

    def add(self, order: Order) -> Order:
        self.db.add(order)
        return order
