"""Sri Lanka Tourist Guide Agent definition for ADK Bidi-streaming."""

import json
import os
from datetime import datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from google.adk.agents import Agent
from google.adk.tools import google_search


def get_current_weather(
    city: str,
    country_code: str | None = None,
    units: str = "metric",
) -> dict:
    """Get current weather for a city using the OpenWeather API.

    Args:
        city: City name (e.g. "Colombo")
        country_code: Optional ISO 3166 country code (e.g. "LK")
        units: "metric" or "imperial" (default: "metric")

    Returns:
        A JSON-serializable dict with key conditions (temp, humidity, wind, etc.)
        or an "error" field if the request fails or is misconfigured.
    """

    api_key = os.getenv("OPENWEATHER_API_KEY")
    if not api_key:
        return {
            "error": "OPENWEATHER_API_KEY is not set. Add it to app/.env (and restart the server)."
        }

    if units not in {"metric", "imperial"}:
        return {"error": "Invalid units. Use 'metric' or 'imperial'."}

    query = city.strip()
    if country_code:
        query = f"{query},{country_code.strip()}"

    params = urlencode({"q": query, "appid": api_key, "units": units})
    url = f"https://api.openweathermap.org/data/2.5/weather?{params}"

    request = Request(url, headers={"Accept": "application/json"})

    try:
        with urlopen(request, timeout=10) as response:
            payload = response.read().decode("utf-8")
            data = json.loads(payload)
    except HTTPError as exc:
        try:
            details = exc.read().decode("utf-8")
        except Exception:  # pragma: no cover
            details = str(exc)
        return {
            "error": "OpenWeather request failed",
            "status": getattr(exc, "code", None),
            "details": details,
        }
    except URLError as exc:
        return {"error": "OpenWeather request failed", "details": str(exc)}
    except Exception as exc:  # pragma: no cover
        return {"error": "OpenWeather request failed", "details": str(exc)}

    weather = (data.get("weather") or [{}])[0] or {}
    main = data.get("main") or {}
    wind = data.get("wind") or {}
    sys = data.get("sys") or {}

    temp_unit = "C" if units == "metric" else "F"
    wind_unit = "m/s" if units == "metric" else "mph"

    return {
        "city": data.get("name") or city,
        "country": sys.get("country") or country_code,
        "conditions": weather.get("main"),
        "description": weather.get("description"),
        "temperature": {"value": main.get("temp"), "unit": temp_unit},
        "feels_like": {"value": main.get("feels_like"), "unit": temp_unit},
        "humidity_percent": main.get("humidity"),
        "wind": {"speed": wind.get("speed"), "unit": wind_unit},
    }


def get_current_time(timezone: str = "Asia/Colombo") -> dict:
    """Get the current local time for a given IANA timezone.

    Args:
        timezone: IANA timezone string (default: "Asia/Colombo").

    Returns:
        A JSON-serializable dict containing the timezone and current time in ISO format,
        or an "error" field if the timezone is invalid.
    """

    try:
        tz = ZoneInfo(timezone)
    except ZoneInfoNotFoundError:
        return {
            "error": "Invalid timezone. Use an IANA timezone like 'Asia/Colombo' or 'UTC'.",
            "timezone": timezone,
        }

    now = datetime.now(tz)
    return {
        "timezone": timezone,
        "iso": now.isoformat(),
        "date": now.date().isoformat(),
        "time": now.strftime("%H:%M:%S"),
        "utc_offset": now.strftime("%z"),
    }

# Default models for Live API with native audio support:
# - Gemini Live API: gemini-2.5-flash-native-audio-preview-12-2025
# - Vertex AI Live API: gemini-live-2.5-flash-native-audio
agent = Agent(
    name="sri_lanka_tourist_guide",
    model=os.getenv(
        "DEMO_AGENT_MODEL", "gemini-2.5-flash-native-audio-preview-12-2025"
    ),
    tools=[google_search, get_current_weather, get_current_time],
    instruction="""You are an enthusiastic and knowledgeable Sri Lankan tourist guide assistant. 
    Your role is to help visitors discover and explore the beautiful island of Sri Lanka.
    
    You provide comprehensive information about:
    - Tourist attractions and landmarks (Sigiriya, Temple of the Tooth, Galle Fort, etc.)
    - Beaches and coastal destinations (Mirissa, Unawatuna, Arugam Bay, etc.)
    - National parks and wildlife (Yala, Udawalawe, Sinharaja rainforest)
    - Cultural sites and historical locations
    - Local cuisine and food recommendations
    - Accommodation options and travel tips
    - Best times to visit different regions
    - Transportation and getting around
    - Cultural customs and etiquette
    - Adventure activities (surfing, hiking, diving, etc.)
    
    Use Google Search when you need current information about:
    - Opening hours and ticket prices
    - Latest travel advisories
    - Current events and festivals
    - Hotel availability and pricing

    Use the weather tool for current weather in a specific city (for example: Colombo, Kandy, Galle).
    Use Google Search for broader forecasts, seasonal patterns, or travel advisories.

    Use the time tool to get the current local time for Sri Lanka (or another timezone) when helping with
    itineraries, opening hours, and planning.
    
    Be warm, friendly, and enthusiastic while maintaining accuracy. Share interesting facts and 
    personal insights about Sri Lankan culture, history, and natural beauty. Help travelers 
    plan their perfect Sri Lankan adventure!""",
)
