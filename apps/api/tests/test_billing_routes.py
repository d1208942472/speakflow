"""Tests for checkout, billing portal, and Stripe webhooks."""
import os
import sys
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_KEY", "test-service-key")
os.environ.setdefault("STRIPE_SECRET_KEY", "sk_test_placeholder")
os.environ.setdefault("STRIPE_ANNUAL_PRICE_ID", "price_test_placeholder")

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from routers.billing import router as billing_router  # noqa: E402
from routers.webhooks import router as webhooks_router  # noqa: E402


def _make_app():
    app = FastAPI()
    app.include_router(billing_router)
    app.include_router(webhooks_router)
    return app


def _make_subscription_db(customer_id: str | None):
    mock_db = MagicMock()
    response = MagicMock()
    response.data = (
        [
            {
                "provider_customer_id": customer_id,
                "billing_email": "owner@example.com",
                "user_id": "user-1",
                "status": "active",
            }
        ]
        if customer_id
        else []
    )

    chain = MagicMock()
    chain.select.return_value = chain
    chain.eq.return_value = chain
    chain.in_.return_value = chain
    chain.order.return_value = chain
    chain.limit.return_value = chain
    chain.execute.return_value = response
    mock_db.table.return_value = chain
    return mock_db


def test_checkout_session_returns_stripe_url():
    fake_stripe = SimpleNamespace(
        checkout=SimpleNamespace(
            Session=SimpleNamespace(
                create=MagicMock(return_value=SimpleNamespace(url="https://checkout.stripe.test/session"))
            )
        )
    )

    with patch("routers.billing._get_stripe_client", return_value=fake_stripe):
        client = TestClient(_make_app())
        response = client.post("/billing/checkout-session", json={"email": "owner@example.com"})

    assert response.status_code == 200
    assert response.json()["url"] == "https://checkout.stripe.test/session"


def test_portal_session_uses_matching_subscription_customer():
    fake_stripe = SimpleNamespace(
        billing_portal=SimpleNamespace(
            Session=SimpleNamespace(
                create=MagicMock(return_value=SimpleNamespace(url="https://billing.stripe.test/portal"))
            )
        )
    )

    with patch("routers.billing.supabase", _make_subscription_db("cus_123")), patch(
        "routers.billing._get_stripe_client", return_value=fake_stripe
    ):
        client = TestClient(_make_app())
        response = client.post("/billing/portal-session", json={"email": "owner@example.com"})

    assert response.status_code == 200
    assert response.json()["url"] == "https://billing.stripe.test/portal"


def test_webhooks_stripe_alias_routes_to_unified_handler():
    event = {"id": "evt_123", "type": "checkout.session.completed", "data": {"object": {}}}

    with patch("routers.billing._parse_stripe_event", return_value=event), patch(
        "routers.billing.sync_stripe_event",
        return_value={"duplicate": False, "linked_user_id": "user-1", "status": "active"},
    ):
        client = TestClient(_make_app())
        response = client.post(
            "/webhooks/stripe",
            data="{}",
            headers={"Stripe-Signature": "test-signature", "Content-Type": "application/json"},
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["provider"] == "stripe"
    assert payload["status"] == "processed"
    assert payload["linked_user_id"] == "user-1"
