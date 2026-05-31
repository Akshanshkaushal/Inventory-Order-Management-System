from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.modules.customers.schemas import CustomerRead


class OrderItemCreate(BaseModel):
    product_id: int = Field(gt=0, examples=[1])
    quantity: int = Field(gt=0, examples=[2])


class OrderCreate(BaseModel):
    customer_id: int = Field(gt=0, examples=[1])
    items: list[OrderItemCreate] = Field(min_length=1)

    @model_validator(mode="after")
    def ensure_unique_products(self) -> "OrderCreate":
        product_ids = [item.product_id for item in self.items]
        if len(product_ids) != len(set(product_ids)):
            raise ValueError("Duplicate products are not allowed in one order payload")
        return self


class ProductSnapshot(BaseModel):
    id: int
    product_name: str
    sku: str

    model_config = ConfigDict(from_attributes=True)


class OrderItemRead(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    subtotal: Decimal
    product: ProductSnapshot

    model_config = ConfigDict(from_attributes=True)


class OrderRead(BaseModel):
    id: int
    customer_id: int
    total_amount: Decimal
    status: str
    created_at: datetime
    customer: CustomerRead
    items: list[OrderItemRead]

    model_config = ConfigDict(from_attributes=True)

