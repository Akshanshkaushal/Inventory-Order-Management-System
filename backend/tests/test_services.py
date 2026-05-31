from decimal import Decimal

from app.database.models.customer import Customer
from app.database.models.product import Product
from app.database.models.order import OrderStatus
from app.modules.orders.schemas import OrderCreate, OrderItemCreate
from app.modules.orders.services import OrderService


def test_order_service_restores_stock_when_order_is_cancelled(db_session):
    product = Product(product_name="Notebook", sku="NOTE-1", price=Decimal("10.00"), quantity_in_stock=4)
    customer = Customer(full_name="Casey Morgan", email="casey@example.com", phone_number="+1-555-0198")
    db_session.add_all([product, customer])
    db_session.commit()
    db_session.refresh(product)
    db_session.refresh(customer)

    service = OrderService(db_session)
    order = service.create_order(
        OrderCreate(customer_id=customer.id, items=[OrderItemCreate(product_id=product.id, quantity=3)])
    )
    assert db_session.get(Product, product.id).quantity_in_stock == 1

    cancelled_order = service.cancel_order(order.id)

    assert db_session.get(Product, product.id).quantity_in_stock == 4
    assert cancelled_order.status == OrderStatus.CANCELLED.value
    assert db_session.get(type(order), order.id).status == OrderStatus.CANCELLED.value
