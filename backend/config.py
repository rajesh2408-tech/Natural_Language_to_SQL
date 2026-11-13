import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from project root
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

DB_TYPE = os.getenv("DB_TYPE", "sqlite").lower()
DB_PATH = os.getenv("DB_PATH", str(BASE_DIR / "data" / "ecommerce.db"))

# Optional MySQL / PostgreSQL credentials
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = int(os.getenv("DB_PORT", "3306" if DB_TYPE == "mysql" else "5432"))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "123456")
DB_NAME = os.getenv("DB_NAME", "natural_to_sql")

# Gemini Models
PRIMARY_MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-lite-latest")
FALLBACK_MODELS = [
    "gemini-flash-lite-latest",
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash-lite",
    "gemini-flash-latest",
]

PORT = int(os.getenv("PORT", "8000"))
HOST = os.getenv("HOST", "0.0.0.0")
