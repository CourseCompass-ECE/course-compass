from dotenv import load_dotenv
import os
import requests
import json

if __name__ == '__main__':
    load_dotenv()
    url = os.getenv("FETCH_RAW_DATA_ENDPOINT")

    try:
        response = requests.get(url)
        response.raise_for_status()

        if (response.ok):
            data = json.loads(response.content)
    except requests.exceptions.RequestException as error:
        raise SystemExit(error)