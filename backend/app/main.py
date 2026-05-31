from flask import Flask, jsonify, redirect, request
from flask_cors import CORS

from app.core.config.settings import settings
from app.core.exceptions.handlers import register_exception_handlers
from app.core.utils.flask_api import close_request_db
from app.core.utils.logging import configure_logging
from app.modules.customers.routes import customers_bp
from app.modules.dashboard.routes import dashboard_bp
from app.modules.orders.routes import orders_bp
from app.modules.products.routes import products_bp

configure_logging()


def create_app() -> Flask:
    app = Flask(__name__)
    app.config["JSON_SORT_KEYS"] = False

    CORS(app, origins=settings.cors_origins, supports_credentials=True)
    register_exception_handlers(app)
    app.teardown_appcontext(close_request_db)

    register_blueprints(app)
    register_platform_routes(app)
    register_docs_routes(app)

    @app.after_request
    def add_security_headers(response):
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        return response

    @app.before_request
    def log_request():
        app.logger.info("%s %s", request.method, request.path)

    return app


def register_blueprints(app: Flask) -> None:
    public_blueprints = (products_bp, customers_bp, orders_bp, dashboard_bp)
    for blueprint in public_blueprints:
        app.register_blueprint(blueprint)

    app.register_blueprint(products_bp, url_prefix="/api/products", name="api_products")
    app.register_blueprint(customers_bp, url_prefix="/api/customers", name="api_customers")
    app.register_blueprint(orders_bp, url_prefix="/api/orders", name="api_orders")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard", name="api_dashboard")


def register_platform_routes(app: Flask) -> None:
    @app.get("/")
    def index():
        return redirect("/docs")

    @app.get("/health")
    def health_check():
        return jsonify({"status": "healthy"})


def register_docs_routes(app: Flask) -> None:
    @app.get("/docs")
    def swagger_ui():
        return """
<!doctype html>
<html>
  <head>
    <title>Inventory & Order Management API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({ url: '/openapi.json', dom_id: '#swagger-ui' });
    </script>
  </body>
</html>
""".strip()

    @app.get("/openapi.json")
    def openapi_json():
        return jsonify(build_openapi_schema())


def build_openapi_schema() -> dict:
    product_schema = {
        "type": "object",
        "required": ["product_name", "sku", "price", "quantity_in_stock"],
        "properties": {
            "product_name": {"type": "string", "example": "Zebra ZD421 Thermal Label Printer"},
            "sku": {"type": "string", "example": "ZBR-ZD421"},
            "price": {"type": "number", "format": "decimal", "example": 329.00},
            "quantity_in_stock": {"type": "integer", "minimum": 0, "example": 8},
        },
    }
    customer_schema = {
        "type": "object",
        "required": ["full_name", "email", "phone_number"],
        "properties": {
            "full_name": {"type": "string", "example": "Northstar Retail Group"},
            "email": {"type": "string", "format": "email", "example": "purchasing@northstarretail.example"},
            "phone_number": {"type": "string", "example": "+1-555-0142"},
        },
    }
    order_schema = {
        "type": "object",
        "required": ["customer_id", "items"],
        "properties": {
            "customer_id": {"type": "integer", "example": 1},
            "items": {
                "type": "array",
                "minItems": 1,
                "items": {
                    "type": "object",
                    "required": ["product_id", "quantity"],
                    "properties": {
                        "product_id": {"type": "integer", "example": 1},
                        "quantity": {"type": "integer", "minimum": 1, "example": 2},
                    },
                },
            },
        },
    }

    return {
        "openapi": "3.0.3",
        "info": {
            "title": settings.app_name,
            "version": "1.0.0",
            "description": "Flask API for product, customer, order, and inventory management.",
        },
        "paths": {
            "/products": _collection_path("Products", product_schema),
            "/products/{product_id}": _item_path("Products", "product_id", include_put=True, update_schema=product_schema),
            "/customers": _collection_path("Customers", customer_schema),
            "/customers/{customer_id}": _item_path("Customers", "customer_id"),
            "/orders": _collection_path("Orders", order_schema),
            "/orders/{order_id}": _item_path("Orders", "order_id"),
            "/dashboard/summary": {"get": {"tags": ["Dashboard"], "summary": "Get dashboard summary", "responses": _responses()}},
            "/health": {"get": {"tags": ["Health"], "summary": "Health check", "responses": {"200": {"description": "Healthy"}}}},
        },
    }


def _collection_path(tag: str, schema: dict) -> dict:
    singular = tag[:-1].lower()
    return {
        "get": {"tags": [tag], "summary": f"List {tag.lower()}", "responses": _responses()},
        "post": {
            "tags": [tag],
            "summary": f"Create {singular}",
            "requestBody": {"required": True, "content": {"application/json": {"schema": schema}}},
            "responses": _responses(created=True),
        },
    }


def _item_path(tag: str, parameter: str, include_put: bool = False, update_schema: dict | None = None) -> dict:
    path = {
        "parameters": [{"name": parameter, "in": "path", "required": True, "schema": {"type": "integer"}}],
        "get": {"tags": [tag], "summary": f"Get {tag[:-1].lower()}", "responses": _responses()},
        "delete": {"tags": [tag], "summary": f"Delete {tag[:-1].lower()}", "responses": _responses()},
    }
    if include_put:
        path["put"] = {
            "tags": [tag],
            "summary": f"Update {tag[:-1].lower()}",
            "requestBody": {"required": True, "content": {"application/json": {"schema": update_schema or {}}}},
            "responses": _responses(),
        }
    return path


def _responses(created: bool = False) -> dict:
    return {
        "201" if created else "200": {"description": "Successful response"},
        "400": {"description": "Bad request"},
        "404": {"description": "Not found"},
        "409": {"description": "Conflict"},
        "422": {"description": "Validation error"},
    }


app = create_app()
