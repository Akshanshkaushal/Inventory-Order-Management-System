from decimal import Decimal

from app.database.models.customer import Customer
from app.database.models.product import Product
from app.database.session import SessionLocal


def run() -> None:
    db = SessionLocal()
    try:
        if db.query(Product).count() == 0:
            db.add_all(
                [
                    Product(product_name="Honeywell Voyager Barcode Scanner", sku="HWL-VYG-1202", price=Decimal("129.00"), quantity_in_stock=34),
                    Product(product_name="Zebra ZD421 Thermal Label Printer", sku="ZBR-ZD421", price=Decimal("329.00"), quantity_in_stock=8),
                    Product(product_name="Avery 4x6 Shipping Labels Pack", sku="AVY-LBL-4X6", price=Decimal("24.50"), quantity_in_stock=18),
                    Product(product_name="Uline Kraft Shipping Boxes", sku="ULN-BOX-1212", price=Decimal("42.00"), quantity_in_stock=6),
                    Product(product_name="Scotch Heavy Duty Packing Tape", sku="MMM-TAPE-3850", price=Decimal("16.75"), quantity_in_stock=3),
                ]
            )
        if db.query(Customer).count() == 0:
            db.add_all(
                [
                    Customer(full_name="Northstar Retail Group", email="purchasing@northstarretail.example", phone_number="+1-555-0142"),
                    Customer(full_name="Summit Office Supply", email="orders@summitoffice.example", phone_number="+1-555-0188"),
                    Customer(full_name="Harbor Lane Outfitters", email="ops@harborlane.example", phone_number="+1-555-0194"),
                ]
            )
        db.commit()
        print("Seed data loaded.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
