from decimal import Decimal
from http import HTTPStatus

from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, selectinload

from app.core.exceptions.handlers import AppError
from app.database.models.customer import Customer
from app.database.models.order import Order, OrderItem, OrderStatus
from app.database.models.product import Product
from app.modules.orders.repositories import OrderRepository
from app.modules.orders.schemas import OrderCreate, OrderRead


class OrderService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = OrderRepository(db)

    def list_orders(self) -> list[Order]:
        return self.repo.list()

    def get_order(self, order_id: int) -> Order:
        order = self.repo.get(order_id)
        if not order:
            raise AppError("Order not found", HTTPStatus.NOT_FOUND)
        return order

    def create_order(self, payload: OrderCreate) -> Order:
        try:
            customer = self.db.get(Customer, payload.customer_id)
            if not customer:
                raise AppError("Customer not found", HTTPStatus.NOT_FOUND)

            product_ids = [item.product_id for item in payload.items]
            products = {
                product.id: product
                for product in self.db.scalars(select(Product).where(Product.id.in_(product_ids)).with_for_update())
            }

            missing = sorted(set(product_ids) - set(products))
            if missing:
                raise AppError("One or more products were not found", HTTPStatus.NOT_FOUND, [{"product_ids": missing}])

            total_amount = Decimal("0.00")
            order = Order(customer_id=payload.customer_id, total_amount=Decimal("0.00"), status=OrderStatus.CREATED.value)

            for item in payload.items:
                product = products[item.product_id]
                if product.quantity_in_stock < item.quantity:
                    raise AppError(
                        "Insufficient inventory",
                        HTTPStatus.BAD_REQUEST,
                        [
                            {
                                "product_id": product.id,
                                "sku": product.sku,
                                "available": product.quantity_in_stock,
                                "requested": item.quantity,
                            }
                        ],
                    )

                subtotal = Decimal(product.price) * item.quantity
                total_amount += subtotal
                product.quantity_in_stock -= item.quantity
                order.items.append(
                    OrderItem(
                        product_id=product.id,
                        quantity=item.quantity,
                        unit_price=product.price,
                        subtotal=subtotal,
                    )
                )

            order.total_amount = total_amount
            self.repo.add(order)
            self.db.commit()
            return self.get_order(order.id)
        except AppError:
            self.db.rollback()
            raise
        except SQLAlchemyError as exc:
            self.db.rollback()
            raise AppError("Order could not be created", HTTPStatus.INTERNAL_SERVER_ERROR) from exc

    def cancel_order(self, order_id: int) -> OrderRead:
        order = self.get_order(order_id)
        if order.status == OrderStatus.CANCELLED.value:
            raise AppError("Order is already cancelled", HTTPStatus.CONFLICT)

        try:
            locked_order = self.db.scalar(
                select(Order)
                .where(Order.id == order_id)
                .options(selectinload(Order.customer), selectinload(Order.items).selectinload(OrderItem.product))
                .with_for_update()
            )
            if not locked_order:
                raise AppError("Order not found", HTTPStatus.NOT_FOUND)

            product_ids = [item.product_id for item in locked_order.items]
            products = {
                product.id: product
                for product in self.db.scalars(select(Product).where(Product.id.in_(product_ids)).with_for_update())
            }

            for item in locked_order.items:
                products[item.product_id].quantity_in_stock += item.quantity

            locked_order.status = OrderStatus.CANCELLED.value
            response = OrderRead.model_validate(locked_order)
            self.db.delete(locked_order)
            self.db.commit()
            return response
        except AppError:
            self.db.rollback()
            raise
        except SQLAlchemyError as exc:
            self.db.rollback()
            raise AppError("Order could not be cancelled", HTTPStatus.INTERNAL_SERVER_ERROR) from exc
