import requests
import json

def send_api():
    base_url = "http://127.0.0.1:5000"
    
    # 1️⃣ Send the power-on command
    power_response = requests.get(f"{base_url}/power", params={"state": "on"})
    
    if power_response.status_code == 200:
        print("Power-on command successful:", power_response.json())
    else:
        print("Failed to power on:", power_response.status_code, power_response.text)
        return  # stop if it failed
    
    # 2️⃣ Ask the machine for its status
    status_response = requests.get(f"{base_url}/status")
    
    if status_response.status_code == 200:
        status = status_response.json()
        print("Machine power state:", status["power"])
    else:
        print("Failed to get status:", status_response.status_code, status_response.text)