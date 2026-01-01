from google.adk import Agent
from google.adk.a2a.utils.agent_to_a2a import to_a2a
import os
from dotenv import load_dotenv

load_dotenv()

# Force Gemini API (AI Studio) by removing Vertex AI configs
if "GOOGLE_CLOUD_PROJECT" in os.environ:
    del os.environ["GOOGLE_CLOUD_PROJECT"]
if "GOOGLE_CLOUD_LOCATION" in os.environ:
    del os.environ["GOOGLE_CLOUD_LOCATION"]
if "GOOGLE_CLOUD_REGION" in os.environ:
    del os.environ["GOOGLE_CLOUD_REGION"]

# 1. Define the weather lookup tool as a function
def get_weather(city: str, date: str) -> str:
    """
    Returns a simple weather forecast for the given city and date.
    Args:
        city (str): The city name (e.g., "Paris").
        date (str): The date or day for the forecast (e.g., "Sunday").
    Returns:
        str: A short weather description (e.g., "sunny", "rainy", "cloudy").
    """
    # For demonstration, use a basic logic or static data:
    city_lower = city.lower()
    date_lower = date.lower()
    # Simple hardcoded conditions for demo:
    if "rain" in city_lower or "london" in city_lower or "india" in city_lower:
        forecast = "rainy"
    elif date_lower in ("saturday", "sunday"):
        # assume weekends are rainy in this dummy logic
        forecast = "rainy"
    else:
        forecast = "sunny"
    return forecast

# 2. Create the WeatherAgent with ADK
weather_agent = Agent(
    name="weather_agent",
    description="An agent that provides weather forecasts using a tool.",
    model="gemini-2.0-flash-exp",  # Using a standard available model
    instruction=(
        "You are a weather information agent. "
        "When asked about the weather, you **must** use the get_weather tool to get the latest forecast. "
        "Provide the forecast briefly and accurately."
    ),
    tools=[ get_weather ]
)


# 3. Expose the agent via A2A (FastAPI app)
a2a_app = to_a2a(weather_agent)

# Expose for ADK Web UI
root_agent = weather_agent
