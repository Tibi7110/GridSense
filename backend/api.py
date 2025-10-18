import requests
import json
import time
import os

def send_api():
    base_url = "http://127.0.0.1:5000"

    power_response = requests.get(f"{base_url}/power", params={"state": "on"})

    if power_response.status_code == 200:
        print("Power-on command successful")
    else:
        print("Failed to power on:", power_response.status_code)
        return

    status_response = requests.get(f"{base_url}/status")

    if status_response.status_code == 200:
        try:
            status = status_response.json()
            print("Machine power state:", status["power"])
        except ValueError:
            print("Could not parse status response as JSON.")
            print("Raw response:", status_response.text)
    else:
        print("Failed to get status:", status_response.status_code)
        time.sleep(5)
        os.system("clear")