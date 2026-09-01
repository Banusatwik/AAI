from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_api_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "OPERATIONAL"

def test_api_evaluate_approved():
    payload = {
        "equipment_code": "P-101",
        "operation_type": "Run",
        "parameters": {
            "rpm": 2700.0,
            "vibration": 2.5,
            "pressure": 11.5,
            "bearing_temperature": 60.0,
            "flow_rate": 110.0
        }
    }
    res = client.post("/api/evaluate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["final_decision"] == "APPROVED"
    assert data["risk_score"] < 50.0
    assert len(data["policy_provenance"]) > 0

def test_api_evaluate_denied():
    payload = {
        "equipment_code": "P-101",
        "operation_type": "Run",
        "parameters": {
            "rpm": 3100.0, # Violates policy
            "vibration": 5.8
        }
    }
    res = client.post("/api/evaluate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["final_decision"] == "DENIED"

def test_api_evaluate_policy_gap():
    payload = {
        "equipment_code": "P-101",
        "operation_type": "Run",
        "parameters": {
            "shaft_misalignment": 3.1
        }
    }
    res = client.post("/api/evaluate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["final_decision"] == "POLICY GAP"
    assert len(data["policy_gaps"]) >= 1

def test_api_equipment_list():
    res = client.get("/api/equipment")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 5

def test_api_policies_list():
    res = client.get("/api/policies")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 3

def test_api_dashboard():
    res = client.get("/api/dashboard")
    assert res.status_code == 200
    data = res.json()
    assert "kpis" in data
    assert "equipment_health" in data

def test_api_statistics_and_probability():
    stats_res = client.get("/api/statistics/P-101/vibration")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["parameter"] == "vibration"
    assert stats["sample_size"] > 50

    prob_res = client.get("/api/probability/P-101/vibration")
    assert prob_res.status_code == 200
    prob = prob_res.json()
    assert prob["parameter"] == "vibration"
    assert len(prob["bins"]) > 0
