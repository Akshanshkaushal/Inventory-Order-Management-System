from flask import Blueprint
from sqlalchemy import func, select

from app.core.config.settings import settings
from app.core.utils.flask_api import api_response, get_request_db
from app.database.models.customer import Customer
from app.database.models.order import Order
from app.database.models.product import Product
from app.modules.dashboard.schemas import DashboardSummary

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/dashboard")


@dashboard_bp.get("/summary")
def get_dashboard_summary():
    db = get_request_db()
    total_products = db.scalar(select(func.count(Product.id))) or 0
    total_customers = db.scalar(select(func.count(Customer.id))) or 0
    total_orders = db.scalar(select(func.count(Order.id))) or 0
    low_stock_products = list(
        db.scalars(
            select(Product)
            .where(Product.quantity_in_stock <= settings.low_stock_threshold)
            .order_by(Product.quantity_in_stock.asc(), Product.product_name.asc())
        )
    )

    data = DashboardSummary(
        total_products=total_products,
        total_customers=total_customers,
        total_orders=total_orders,
        low_stock_products=low_stock_products,
    )
    return api_response("Dashboard summary retrieved", data)
