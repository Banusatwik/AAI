import re
import json
import logging
from typing import Dict, Any, Tuple, Optional
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

def extract_parameters_from_text(prompt: str) -> Tuple[Optional[str], str, Dict[str, float]]:
    """
    Operation Understanding Agent (Agent 1).
    Extracts equipment_code, operation_type, and numerical mechanical parameters.
    Uses OpenAI LLM if configured, with comprehensive deterministic regex fallback.
    """
    if not prompt:
        return None, "Run", {}

    # Attempt LLM extraction if API key is provided
    if settings.OPENAI_API_KEY:
        try:
            import httpx
            headers = {
                "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                "Content-Type": "application/json"
            }
            system_prompt = (
                "You are an expert Mechanical Engineering NLP Agent. Extract equipment code, operation type, "
                "and mechanical parameters (standardized keys: rpm, vibration, pressure, temperature, flow_rate, "
                "bearing_temperature, power_kw, lubrication_pressure, shaft_misalignment) with numerical values. "
                "Respond ONLY with valid JSON in this format: "
                "{\"equipment_code\": \"...\", \"operation_type\": \"Run\", \"parameters\": {\"rpm\": 2900, ...}}"
            )
            payload = {
                "model": settings.OPENAI_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.0,
                "response_format": {"type": "json_object"}
            }
            with httpx.Client(timeout=10.0) as client:
                res = client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    parsed = json.loads(data["choices"][0]["message"]["content"])
                    equip = parsed.get("equipment_code")
                    op = parsed.get("operation_type", "Run")
                    params = {k: float(v) for k, v in parsed.get("parameters", {}).items() if v is not None}
                    return equip, op, params
        except Exception as e:
            logger.warning(f"LLM extraction failed, falling back to deterministic parser: {e}")

    # Deterministic NLP Fallback
    text = prompt.strip()
    
    # Extract equipment code like P-101, P101, Pump-101, C-201, T-301
    equip_code = None
    equip_match = re.search(r'\b(P[-_]?10[1-9]|C[-_]?20[1-9]|T[-_]?30[1-9]|PUMP[-_]?\w+|COMPRESSOR[-_]?\w+|TURBINE[-_]?\w+)\b', text, re.IGNORECASE)
    if equip_match:
        raw_eq = equip_match.group(1).upper().replace("_", "-")
        # Normalize e.g. P101 -> P-101
        if re.match(r'^[PCT]\d{3}$', raw_eq):
            equip_code = f"{raw_eq[0]}-{raw_eq[1:]}"
        else:
            equip_code = raw_eq

    # Extract Operation Type (Run, Start, Stop, Ramp, Test, Throttle)
    op_type = "Run"
    if re.search(r'\b(start|startup|start-up)\b', text, re.IGNORECASE):
        op_type = "Startup"
    elif re.search(r'\b(stop|shutdown|shut-down)\b', text, re.IGNORECASE):
        op_type = "Shutdown"
    elif re.search(r'\b(ramp|ramp-up|throttle)\b', text, re.IGNORECASE):
        op_type = "Ramp"
    elif re.search(r'\b(test|benchmark)\b', text, re.IGNORECASE):
        op_type = "Test"

    parameters: Dict[str, float] = {}

    # Extract RPM (e.g. 2900 rpm, 2900 RPM, speed: 2850)
    rpm_match = re.search(r'(?:rpm|speed|velocity)[:\s=]*(\d+(?:\.\d+)?)\s*(?:rpm)?|(?:(\d+(?:\.\d+)?)\s*rpm)', text, re.IGNORECASE)
    if rpm_match:
        val = rpm_match.group(1) or rpm_match.group(2)
        parameters["rpm"] = float(val)

    # Extract Vibration (e.g. 4.2 mm/s, vibration: 4.5, vib: 3.2)
    vib_match = re.search(r'(?:vibration|vib)[:\s=]*(\d+(?:\.\d+)?)\s*(?:mm/s|mms)?|(?:(\d+(?:\.\d+)?)\s*mm/s)', text, re.IGNORECASE)
    if vib_match:
        val = vib_match.group(1) or vib_match.group(2)
        parameters["vibration"] = float(val)

    # Extract Bearing Temperature (e.g. bearing temp: 78°C, bearing temperature: 80C)
    bearing_temp_match = re.search(r'(?:bearing\s*temp(?:erature)?|bearing)[:\s=]*(\d+(?:\.\d+)?)\s*(?:°?c|deg\s*c)?', text, re.IGNORECASE)
    if bearing_temp_match:
        parameters["bearing_temperature"] = float(bearing_temp_match.group(1))

    # Extract General Temperature if not matched as bearing temp
    if "bearing_temperature" not in parameters:
        temp_match = re.search(r'(?:temperature|temp)[:\s=]*(\d+(?:\.\d+)?)\s*(?:°?c|deg\s*c)?|(?:(\d+(?:\.\d+)?)\s*(?:°c|degc))', text, re.IGNORECASE)
        if temp_match:
            val = temp_match.group(1) or temp_match.group(2)
            parameters["temperature"] = float(val)

    # Extract Pressure (e.g. 14 bar, pressure: 12.5 bar, 150 psi)
    press_match = re.search(r'(?:pressure|press)[:\s=]*(\d+(?:\.\d+)?)\s*(?:bar|psi|kpa)?|(?:(\d+(?:\.\d+)?)\s*(?:bar|psi|kpa))', text, re.IGNORECASE)
    if press_match:
        val = press_match.group(1) or press_match.group(2)
        parameters["pressure"] = float(val)

    # Extract Flow Rate (e.g. 120 m3/h, flow: 125 m³/h, flow rate 110)
    flow_match = re.search(r'(?:flow\s*rate|flow)[:\s=]*(\d+(?:\.\d+)?)\s*(?:m3/h|m³/h|l/min|gpm)?|(?:(\d+(?:\.\d+)?)\s*(?:m3/h|m³/h))', text, re.IGNORECASE)
    if flow_match:
        val = flow_match.group(1) or flow_match.group(2)
        parameters["flow_rate"] = float(val)

    # Extract Power (e.g. 75 kW, power: 80 kW)
    power_match = re.search(r'(?:power|load)[:\s=]*(\d+(?:\.\d+)?)\s*(?:kw|hp)?|(?:(\d+(?:\.\d+)?)\s*(?:kw|hp))', text, re.IGNORECASE)
    if power_match:
        val = power_match.group(1) or power_match.group(2)
        parameters["power_kw"] = float(val)

    # Extract Lubrication Pressure
    lube_match = re.search(r'(?:lubrication\s*pressure|lube\s*pressure|lube)[:\s=]*(\d+(?:\.\d+)?)\s*(?:bar)?', text, re.IGNORECASE)
    if lube_match:
        parameters["lubrication_pressure"] = float(lube_match.group(1))

    # Extract Shaft Misalignment (Policy Gap example)
    misalign_match = re.search(r'(?:shaft\s*misalignment|misalignment)[:\s=]*(\d+(?:\.\d+)?)\s*(?:mm|mils)?|(?:(\d+(?:\.\d+)?)\s*mm\s*misalignment)', text, re.IGNORECASE)
    if misalign_match:
        val = misalign_match.group(1) or misalign_match.group(2)
        parameters["shaft_misalignment"] = float(val)

    return equip_code, op_type, parameters
