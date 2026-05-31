from decimal import Decimal

from app.database.models.customer import Customer
from app.database.models.order import Order, OrderItem
from app.database.models.product import Product
from app.database.session import SessionLocal


PRODUCTS = [
    ("Honeywell Voyager Barcode Scanner", "HWL-VYG-1202", Decimal("129.00"), 34),
    ("Zebra ZD421 Thermal Label Printer", "ZBR-ZD421", Decimal("329.00"), 8),
    ("Avery 4x6 Shipping Labels Pack", "AVY-LBL-4X6", Decimal("24.50"), 18),
    ("Uline Kraft Shipping Boxes", "ULN-BOX-1212", Decimal("42.00"), 6),
    ("Scotch Heavy Duty Packing Tape", "MMM-TAPE-3850", Decimal("16.75"), 3),
]

CUSTOMERS = [
    ("Northstar Retail Group", "purchasing@northstarretail.example", "+1-555-0142"),
    ("Summit Office Supply", "orders@summitoffice.example", "+1-555-0188"),
    ("Harbor Lane Outfitters", "ops@harborlane.example", "+1-555-0194"),
]


def run() -> None:
    db = SessionLocal()
    try:
        db.query(OrderItem).delete()
        db.query(Order).delete()
        db.query(Product).delete()
        db.query(Customer).delete()

        db.add_all(
            [
                Product(product_name=name, sku=sku, price=price, quantity_in_stock=stock)
                for name, sku, price, stock in PRODUCTS
            ]
        )
        db.add_all(
            [Customer(full_name=name, email=email, phone_number=phone) for name, email, phone in CUSTOMERS]
        )
        db.commit()
        print("Demo data reset.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
