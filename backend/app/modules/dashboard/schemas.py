from pydantic import BaseModel

from app.modules.products.schemas import ProductRead


class DashboardSummary(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    low_stock_products: list[ProductRead]

