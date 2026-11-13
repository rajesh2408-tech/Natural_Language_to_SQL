import sqlite3
import time
import re
from typing import Dict, Any, List, Optional
from pathlib import Path
from decimal import Decimal
import datetime

from backend.config import DB_PATH, DB_TYPE, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
from backend.safety import validate_sql_safety
from backend.seed_data import seed_database

class DatabaseManager:
    def __init__(self):
        self.db_type = DB_TYPE
        self.db_path = DB_PATH
        self._ensure_database_ready()

    def _ensure_database_ready(self):
        """Initializes and seeds database if it does not exist."""
        if self.db_type == "sqlite":
            p = Path(self.db_path)
            if not p.exists() or p.stat().st_size == 0:
                print(f"Database file not found at {self.db_path}. Seeding now...")
                seed_database(str(p))
        elif self.db_type == "mysql":
            try:
                conn = self.get_connection()
                cur = conn.cursor()
                cur.execute(
                    "SELECT COUNT(*) AS cnt FROM information_schema.TABLES "
                    "WHERE TABLE_SCHEMA = %s AND TABLE_TYPE = 'BASE TABLE';",
                    (DB_NAME,)
                )
                res = cur.fetchone()
                cnt = res["cnt"] if isinstance(res, dict) else res[0]
                conn.close()
                if cnt == 0:
                    print(f"MySQL database '{DB_NAME}' has no tables. Seeding now...")
                    seed_database()
            except Exception as e:
                print(f"Notice: MySQL check: {e}")

    def get_connection(self):
        """Returns a database connection based on configured engine."""
        if self.db_type == "sqlite":
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            # Enforce read-only at connection level if possible, or foreign keys
            conn.execute("PRAGMA foreign_keys = ON;")
            return conn
        elif self.db_type == "mysql":
            import pymysql
            return pymysql.connect(
                host=DB_HOST,
                port=DB_PORT,
                user=DB_USER,
                password=DB_PASSWORD,
                database=DB_NAME,
                charset="utf8mb4",
                cursorclass=pymysql.cursors.DictCursor,
                autocommit=True
            )
        else:
            raise ValueError(f"Unsupported DB_TYPE: {self.db_type}")

    @staticmethod
    def _sanitize_val(val):
        if isinstance(val, Decimal):
            return float(val)
        if isinstance(val, (datetime.date, datetime.datetime, datetime.time)):
            return str(val)
        if isinstance(val, bytes):
            return val.decode("utf-8", errors="replace")
        return val

    @classmethod
    def _sanitize_row(cls, row_dict: Dict[str, Any]) -> Dict[str, Any]:
        return {k: cls._sanitize_val(v) for k, v in row_dict.items()}

    def get_schema_info(self) -> Dict[str, Any]:
        """
        Introspects the database to return comprehensive metadata:
        - List of tables
        - Columns, types, primary keys, nullability
        - Foreign keys
        - Live row counts
        - Sample rows (first 3 rows for preview)
        """
        conn = self.get_connection()
        cur = conn.cursor()
        schema = {"engine": self.db_type, "tables": {}}

        try:
            if self.db_type == "sqlite":
                cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
                tables = [row["name"] if isinstance(row, sqlite3.Row) else row[0] for row in cur.fetchall()]

                for table in tables:
                    # Column metadata
                    cur.execute(f"PRAGMA table_info({table});")
                    columns = []
                    for col in cur.fetchall():
                        columns.append({
                            "cid": col["cid"] if isinstance(col, sqlite3.Row) else col[0],
                            "name": col["name"] if isinstance(col, sqlite3.Row) else col[1],
                            "type": col["type"] if isinstance(col, sqlite3.Row) else col[2],
                            "notnull": bool(col["notnull"] if isinstance(col, sqlite3.Row) else col[3]),
                            "pk": bool(col["pk"] if isinstance(col, sqlite3.Row) else col[5]),
                        })

                    # Foreign keys
                    cur.execute(f"PRAGMA foreign_key_list({table});")
                    fks = []
                    for fk in cur.fetchall():
                        fks.append({
                            "from": fk["from"] if isinstance(fk, sqlite3.Row) else fk[3],
                            "table": fk["table"] if isinstance(fk, sqlite3.Row) else fk[2],
                            "to": fk["to"] if isinstance(fk, sqlite3.Row) else fk[4],
                        })

                    # Live row count
                    cur.execute(f"SELECT COUNT(*) FROM {table};")
                    count_row = cur.fetchone()
                    row_count = count_row[0] if not isinstance(count_row, sqlite3.Row) else count_row[list(count_row.keys())[0]]

                    # Sample 3 rows for preview
                    cur.execute(f"SELECT * FROM {table} LIMIT 3;")
                    sample_rows = [self._sanitize_row(dict(r)) for r in cur.fetchall()]

                    schema["tables"][table] = {
                        "name": table,
                        "columns": columns,
                        "foreign_keys": fks,
                        "row_count": row_count,
                        "sample_rows": sample_rows,
                    }

            elif self.db_type == "mysql":
                cur.execute(
                    "SELECT TABLE_NAME FROM information_schema.TABLES "
                    "WHERE TABLE_SCHEMA = %s AND TABLE_TYPE = 'BASE TABLE' "
                    "ORDER BY TABLE_NAME;",
                    (DB_NAME,)
                )
                tables = [row["TABLE_NAME"] if isinstance(row, dict) else row[0] for row in cur.fetchall()]

                for table in tables:
                    # Column metadata
                    cur.execute(
                        "SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY "
                        "FROM information_schema.COLUMNS "
                        "WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s "
                        "ORDER BY ORDINAL_POSITION;",
                        (DB_NAME, table)
                    )
                    columns = []
                    for idx, col in enumerate(cur.fetchall()):
                        col_dict = col if isinstance(col, dict) else {
                            "COLUMN_NAME": col[0],
                            "COLUMN_TYPE": col[2],
                            "IS_NULLABLE": col[3],
                            "COLUMN_KEY": col[4]
                        }
                        columns.append({
                            "cid": idx,
                            "name": col_dict["COLUMN_NAME"],
                            "type": col_dict["COLUMN_TYPE"],
                            "notnull": (col_dict["IS_NULLABLE"] == "NO"),
                            "pk": (col_dict["COLUMN_KEY"] == "PRI"),
                        })

                    # Foreign keys
                    cur.execute(
                        "SELECT COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME "
                        "FROM information_schema.KEY_COLUMN_USAGE "
                        "WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s "
                        "AND REFERENCED_TABLE_NAME IS NOT NULL;",
                        (DB_NAME, table)
                    )
                    fks = []
                    for fk in cur.fetchall():
                        fk_dict = fk if isinstance(fk, dict) else {
                            "COLUMN_NAME": fk[0],
                            "REFERENCED_TABLE_NAME": fk[1],
                            "REFERENCED_COLUMN_NAME": fk[2]
                        }
                        fks.append({
                            "from": fk_dict["COLUMN_NAME"],
                            "table": fk_dict["REFERENCED_TABLE_NAME"],
                            "to": fk_dict["REFERENCED_COLUMN_NAME"],
                        })

                    # Live row count
                    cur.execute(f"SELECT COUNT(*) AS cnt FROM `{table}`;")
                    count_row = cur.fetchone()
                    row_count = count_row["cnt"] if isinstance(count_row, dict) else count_row[0]

                    # Sample 3 rows for preview
                    cur.execute(f"SELECT * FROM `{table}` LIMIT 3;")
                    sample_rows = [self._sanitize_row(r if isinstance(r, dict) else dict(zip([c['name'] for c in columns], r))) for r in cur.fetchall()]

                    schema["tables"][table] = {
                        "name": table,
                        "columns": columns,
                        "foreign_keys": fks,
                        "row_count": row_count,
                        "sample_rows": sample_rows,
                    }

            return schema
        finally:
            conn.close()

    def get_schema_summary_text(self) -> str:
        """
        Generates a concise schema summary formatted for LLM system prompt.
        """
        schema_info = self.get_schema_info()
        lines = []
        lines.append(f"Database Engine: {schema_info['engine'].upper()}\nAvailable Tables & Schema:")

        for tbl_name, tbl_data in schema_info["tables"].items():
            col_strs = []
            for c in tbl_data["columns"]:
                pk_str = " PRIMARY KEY" if c["pk"] else ""
                col_strs.append(f"{c['name']} {c['type']}{pk_str}")
            
            lines.append(f"- {tbl_name} ({', '.join(col_strs)})")
            if tbl_data["foreign_keys"]:
                fk_strs = [f"{fk['from']} -> {fk['table']}({fk['to']})" for fk in tbl_data["foreign_keys"]]
                lines.append(f"  Relationships: {', '.join(fk_strs)}")

        return "\n".join(lines)

    def format_error_message(self, raw_err: str, sql: str) -> str:
        """
        Translates raw database error strings into clear, actionable human-readable messages.
        """
        err_lower = raw_err.lower()

        # Missing table error (SQLite & MySQL)
        m_tbl_sqlite = re.search(r"no such table:\s*([a-zA-Z0-9_]+)", raw_err, re.IGNORECASE)
        m_tbl_mysql = re.search(r"table '([^']+)' doesn't exist", raw_err, re.IGNORECASE)
        if m_tbl_sqlite or m_tbl_mysql:
            tbl_name = m_tbl_sqlite.group(1) if m_tbl_sqlite else m_tbl_mysql.group(1).split(".")[-1]
            try:
                schema = self.get_schema_info()
                available = ", ".join(schema["tables"].keys())
                return f"Database Error: Table '{tbl_name}' does not exist. Available tables are: {available}."
            except Exception:
                return f"Database Error: Table '{tbl_name}' does not exist."

        # Missing column error (SQLite & MySQL)
        m_col_sqlite = re.search(r"no such column:\s*([a-zA-Z0-9_\.]+)", raw_err, re.IGNORECASE)
        m_col_mysql = re.search(r"unknown column '([^']+)'", raw_err, re.IGNORECASE)
        if m_col_sqlite or m_col_mysql:
            col_name = m_col_sqlite.group(1) if m_col_sqlite else m_col_mysql.group(1)
            return (
                f"Database Error: Column '{col_name}' was not found. "
                "Please verify the column name against the database schema."
            )

        # Ambiguous column error
        if "ambiguous column" in err_lower or "column in field list is ambiguous" in err_lower:
            m_amb = re.search(r"ambiguous column name:\s*([a-zA-Z0-9_\.]+)", raw_err, re.IGNORECASE)
            if not m_amb:
                m_amb = re.search(r"column '([^']+)' in field list is ambiguous", raw_err, re.IGNORECASE)
            col = m_amb.group(1) if m_amb else "specified column"
            return (
                f"Database Error: Ambiguous column '{col}'. "
                "Multiple tables in the query share this column name. Prefix it with the table alias (e.g. users.id)."
            )

        # Syntax error
        if "syntax error" in err_lower or "you have an error in your sql syntax" in err_lower:
            return (
                f"SQL Syntax Error: {raw_err}. "
                "Please check the SQL query structure, keywords, and clauses."
            )

        # Access / connection error
        if "access denied for user" in err_lower:
            return f"Database Access Error: {raw_err}. Please check your database credentials in .env."
        if "can't connect to" in err_lower:
            return f"Database Connection Error: {raw_err}. Please ensure your database server is running."

        return f"Database Execution Error: {raw_err}"

    def execute_query(self, sql: str, limit: Optional[int] = 500) -> Dict[str, Any]:
        """
        Safely executes a read-only query and returns structured results, execution metrics,
        and human-friendly error messages if execution fails.
        """
        # Step 1: Safety validation
        is_safe, safety_err = validate_sql_safety(sql)
        if not is_safe:
            return {
                "success": False,
                "error": safety_err,
                "is_mutation_declined": True,
                "columns": [],
                "rows": [],
                "total_rows": 0,
                "duration_ms": 0.0,
                "sql": sql,
            }

        conn = None
        start_time = time.perf_counter()

        try:
            conn = self.get_connection()
            cur = conn.cursor()

            # Execute the query
            cur.execute(sql)

            # Extract column headers
            if cur.description:
                columns = [desc[0] for desc in cur.description]
            else:
                columns = []

            # Fetch rows
            raw_rows = cur.fetchall()
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)

            rows = []
            for r in raw_rows:
                if isinstance(r, sqlite3.Row):
                    rows.append(self._sanitize_row(dict(r)))
                elif isinstance(r, dict):
                    rows.append(self._sanitize_row(r))
                else:
                    rows.append(self._sanitize_row(dict(zip(columns, r))))

            total_rows = len(rows)

            return {
                "success": True,
                "error": None,
                "columns": columns,
                "rows": rows,
                "total_rows": total_rows,
                "duration_ms": duration_ms,
                "sql": sql,
                "empty": total_rows == 0,
                "message": "Query executed successfully." if total_rows > 0 else "Query ran successfully, but returned 0 results matching your criteria."
            }

        except Exception as e:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            friendly_err = self.format_error_message(str(e), sql)
            return {
                "success": False,
                "error": friendly_err,
                "raw_error": str(e),
                "columns": [],
                "rows": [],
                "total_rows": 0,
                "duration_ms": duration_ms,
                "sql": sql,
            }
        finally:
            if conn:
                conn.close()

db_manager = DatabaseManager()
