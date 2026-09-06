from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_scan_contract_returns_explicit_placeholder_warning() -> None:
    response = client.post(
        "/v1/scan",
        json={
            "observation_id": "00000000-0000-0000-0000-000000000001",
            "image_url": "https://example.com/map.png",
            "width": 1179,
            "height": 2556,
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["detections"] == []
    assert "recognition_pipeline_not_configured" in payload["warnings"]
