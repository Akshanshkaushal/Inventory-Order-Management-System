from http import HTTPStatus
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions.handlers import AppError
from app.database.models.product import Product
from app.modules.products.repositories import ProductRepository
from app.modules.products.schemas import ProductCreate, ProductUpdate


class ProductService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ProductRepository(db)

    def list_products(self, search: str | None = None, skip: int = 0, limit: int = 50) -> list[Product]:
        return self.repo.list(search=search, skip=skip, limit=limit)

    def get_product(self, product_id: int) -> Product:
        product = self.repo.get(product_id)
        if not product:
            raise AppError("Product not found", HTTPStatus.NOT_FOUND)
        return product

    def create_product(self, payload: ProductCreate) -> Product:
        if self.repo.get_by_sku(payload.sku):
            raise AppError("Product SKU already exists", HTTPStatus.CONFLICT)
        product = self.repo.create(payload)
        return self._commit(product)

    def update_product(self, product_id: int, payload: ProductUpdate) -> Product:
        product = self.get_product(product_id)
        if payload.sku:
            existing = self.repo.get_by_sku(payload.sku)
            if existing and existing.id != product_id:
                raise AppError("Product SKU already exists", HTTPStatus.CONFLICT)
        self.repo.update(product, payload)
        return self._commit(product)

    def delete_product(self, product_id: int) -> None:
        product = self.get_product(product_id)
        self.repo.delete(product)
        try:
            self.db.commit()
        except IntegrityError as exc:
            self.db.rollback()
            raise AppError(
                "Product cannot be deleted because it is referenced by order history",
                HTTPStatus.CONFLICT,
            ) from exc

    def _commit(self, product: Product) -> Product:
        try:
            self.db.commit()
            self.db.refresh(product)
            return product
        except IntegrityError as exc:
            self.db.rollback()
            raise AppError("Product could not be saved", HTTPStatus.CONFLICT) from exc
