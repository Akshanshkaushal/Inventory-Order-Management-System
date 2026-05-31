from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models.product import Product
from app.modules.products.schemas import ProductCreate, ProductUpdate


class ProductRepository:
    def __init__(self, db: Session):
        self.db = db

    def list(self, search: str | None = None, skip: int = 0, limit: int = 50) -> list[Product]:
        statement = select(Product).order_by(Product.created_at.desc()).offset(skip).limit(limit)
        if search:
            like = f"%{search}%"
            statement = (
                select(Product)
                .where((Product.product_name.ilike(like)) | (Product.sku.ilike(like)))
                .order_by(Product.created_at.desc())
                .offset(skip)
                .limit(limit)
            )
        return list(self.db.scalars(statement))

    def get(self, product_id: int) -> Product | None:
        return self.db.get(Product, product_id)

    def get_by_sku(self, sku: str) -> Product | None:
        return self.db.scalar(select(Product).where(Product.sku == sku))

    def create(self, payload: ProductCreate) -> Product:
        product = Product(**payload.model_dump())
        self.db.add(product)
        return product

    def update(self, product: Product, payload: ProductUpdate) -> Product:
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(product, field, value)
        return product

    def delete(self, product: Product) -> None:
        self.db.delete(product)

