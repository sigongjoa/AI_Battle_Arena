import requests

url = "http://localhost:8001/api/character-theme"
params = {"ad_text": "F1 레이싱 광고"}

try:
    response = requests.get(url, params=params)
    response.raise_for_status()  # Raise an exception for HTTP errors
    print(response.json())
except requests.exceptions.RequestException as e:
    print(f"Error making request: {e}")
