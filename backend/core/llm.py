from google import genai
from backend.config.settings import GEMINI_API_KEY

client = genai.Client(api_key=GEMINI_API_KEY)
MODEL = "gemini-2.5-flash"


async def generate(prompt: str, system_instruction: str = "") -> str:
    """Generate text using Gemini API."""
    config = {}
    if system_instruction:
        config["system_instruction"] = system_instruction

    response = client.models.generate_content(
        model=MODEL,
        contents=prompt,
        config=config if config else None,
    )
    return response.text


async def generate_json(prompt: str, system_instruction: str = "") -> str:
    """Generate JSON output using Gemini API."""
    config = {"response_mime_type": "application/json"}
    if system_instruction:
        config["system_instruction"] = system_instruction

    response = client.models.generate_content(
        model=MODEL,
        contents=prompt,
        config=config,
    )
    return response.text
