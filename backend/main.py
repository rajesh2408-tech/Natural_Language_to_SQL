import os
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from backend.config import PORT, HOST, DB_TYPE, PRIMARY_MODEL
from backend.database import db_manager
from backend.sql_generator import generate_sql_from_prompt
from backend.seed_data import seed_database
from backend.safety import validate_natural_language_input, validate_sql_safety

app = FastAPI(
    title="Natural to SQL Engine API",
    description="Full-featured Natural Language to SQL Engine powered by Google Gemini",
    version="1.0.0"
)

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenerateSqlRequest(BaseModel):
    prompt: str = Field(..., description="Natural language query description")

class ExecuteSqlRequest(BaseModel):
    sql: str = Field(..., description="SQL query to execute")
    prompt: Optional[str] = Field(None, description="Associated natural language prompt")

class FullQueryRequest(BaseModel):
    prompt: str = Field(..., description="Natural language query")

@app.get("/api/health")
def health_check():
    schema = db_manager.get_schema_info()
    table_counts = {t: data["row_count"] for t, data in schema.get("tables", {}).items()}
    return {
        "status": "healthy",
        "db_type": DB_TYPE,
        "primary_model": PRIMARY_MODEL,
        "tables": table_counts,
        "total_tables": len(table_counts)
    }

@app.get("/api/schema")
def get_schema():
    """Returns database schema metadata for Schema Explorer."""
    return db_manager.get_schema_info()

@app.post("/api/db/reseed")
def reseed_db():
    """Reseeds the database with realistic sample data."""
    counts = seed_database()
    return {
        "success": True,
        "message": "Database reseeded successfully.",
        "counts": counts
    }

@app.post("/api/generate-sql")
def generate_sql_endpoint(req: GenerateSqlRequest):
    """Generates SQL from natural language prompt."""
    res = generate_sql_from_prompt(req.prompt)
    return res

@app.post("/api/execute-sql")
def execute_sql_endpoint(req: ExecuteSqlRequest):
    """Executes a SQL query safely and returns dynamic structured results."""
    res = db_manager.execute_query(req.sql)
    return res

@app.post("/api/query")
def full_query_endpoint(req: FullQueryRequest):
    """Generates SQL and executes it in a single unified flow."""
    # 1. Generate SQL
    gen_res = generate_sql_from_prompt(req.prompt)
    if not gen_res.get("success"):
        return {
            "success": False,
            "error": gen_res.get("error"),
            "is_mutation_declined": gen_res.get("is_mutation_declined", False),
            "sql": None,
            "columns": [],
            "rows": [],
            "total_rows": 0,
            "duration_ms": 0.0,
        }

    generated_sql = gen_res["sql"]

    # 2. Execute SQL
    exec_res = db_manager.execute_query(generated_sql)
    
    return {
        **exec_res,
        "explanation": gen_res.get("explanation"),
        "assumptions": gen_res.get("assumptions"),
        "model_used": gen_res.get("model_used"),
        "prompt": req.prompt,
    }

# Mount static frontend files if built
FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        file_path = FRONTEND_DIST / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIST / "index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=HOST, port=PORT, reload=True)
