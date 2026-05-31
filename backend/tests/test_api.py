def create_product(client, sku="SKU-1", quantity=5):
    response = client.post(
        "/api/products",
        json={"product_name": "Desk Lamp", "sku": sku, "price": "25.50", "quantity_in_stock": quantity},
    )
    assert response.status_code == 201
    return response.get_json()["data"]


def create_customer(client, email="buyer@example.com"):
    response = client.post(
        "/api/customers",
        json={"full_name": "Buyer One", "email": email, "phone_number": "+1-555-0123"},
    )
    assert response.status_code == 201
    return response.get_json()["data"]


def test_product_sku_must_be_unique(client):
    create_product(client, sku="DUP-1")
    response = client.post(
        "/api/products",
        json={"product_name": "Desk Lamp 2", "sku": "dup-1", "price": "30.00", "quantity_in_stock": 3},
    )

    assert response.status_code == 409
    assert response.get_json()["success"] is False


def test_customer_email_must_be_unique(client):
    create_customer(client, email="person@example.com")
    response = client.post(
        "/api/customers",
        json={"full_name": "Person Two", "email": "PERSON@example.com", "phone_number": "+1-555-0999"},
    )

    assert response.status_code == 409


def test_order_deducts_inventory_and_calculates_total(client):
    product = create_product(client, quantity=5)
    customer = create_customer(client)

    response = client.post(
        "/api/orders",
        json={"customer_id": customer["id"], "items": [{"product_id": product["id"], "quantity": 2}]},
    )

    assert response.status_code == 201
    order = response.get_json()["data"]
    assert order["total_amount"] == "51.00"

    product_response = client.get(f"/api/products/{product['id']}")
    assert product_response.get_json()["data"]["quantity_in_stock"] == 3


def test_order_rejects_insufficient_inventory(client):
    product = create_product(client, quantity=1)
    customer = create_customer(client)

    response = client.post(
        "/api/orders",
        json={"customer_id": customer["id"], "items": [{"product_id": product["id"], "quantity": 2}]},
    )

    assert response.status_code == 400
    assert "Insufficient inventory" in response.get_json()["message"]
