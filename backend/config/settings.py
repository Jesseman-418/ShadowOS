import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GMAIL_CREDENTIALS_PATH = os.getenv("GMAIL_CREDENTIALS_PATH", "credentials.json")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./shadowos.db")
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "")

# Agent configuration
MAX_PROSPECTS_PER_RUN = int(os.getenv("MAX_PROSPECTS_PER_RUN", "30"))
DEFAULT_NICHE = os.getenv("DEFAULT_NICHE", "fitness coaches")
FOLLOWER_MIN = int(os.getenv("FOLLOWER_MIN", "10000"))
FOLLOWER_MAX = int(os.getenv("FOLLOWER_MAX", "100000"))
