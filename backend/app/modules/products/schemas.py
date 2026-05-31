from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ProductBase(BaseModel):
    product_name: str = Field(min_length=2, max_length=160, examples=["Wireless Barcode Scanner"])
    sku: str = Field(min_length=2, max_length=64, examples=["SCN-001"])
    price: Decimal = Field(ge=0, examples=["89.99"])
    quantity_in_stock: int = Field(ge=0, examples=[35])

    @field_validator("product_name", "sku")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip()

    @field_validator("sku")
    @classmethod
    def normalize_sku(cls, value: str) -> str:
        return value.strip().upper()


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    product_name: str | None = Field(default=None, min_length=2, max_length=160)
    sku: str | None = Field(default=None, min_length=2, max_length=64)
    price: Decimal | None = Field(default=None, ge=0)
    quantity_in_stock: int | None = Field(default=None, ge=0)

    @field_validator("product_name", "sku")
    @classmethod
    def strip_optional_text(cls, value: str | None) -> str | None:
        return value.strip() if value else value

    @field_validator("sku")
    @classmethod
    def normalize_optional_sku(cls, value: str | None) -> str | None:
        return value.strip().upper() if value else value


class ProductRead(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

