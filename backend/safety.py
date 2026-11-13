import re
import sqlparse
from sqlparse.sql import Statement
from typing import Tuple, Optional

FORBIDDEN_KEYWORDS = {
    "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "TRUNCATE", 
    "CREATE", "REPLACE", "RENAME", "ATTACH", "DETACH", "GRANT", 
    "REVOKE", "MERGE", "UPSERT", "PRAGMA", "VACUUM", "EXEC", 
    "EXECUTE"
}

MUTATION_PROMPT_PATTERNS = [
    r"\b(delete|remove|erase|clear)\b",
    r"\b(drop|destroy)\b",
    r"\b(insert|add|create|append)\s+(a\s+)?(new\s+)?(user|order|product|row|record|table|item|review)\b",
    r"\b(update|modify|change|set)\s+(the\s+)?(price|name|status|email|role|table|column|stock)\b",
    r"\btruncate\b",
    r"\balter\s+table\b",
]

def validate_natural_language_input(prompt: str) -> Tuple[bool, Optional[str]]:
    """
    Validates natural language input for minimum length and mutation intent.
    Returns (is_valid, error_message).
    """
    if not prompt or not prompt.strip():
        return False, "Input cannot be empty. Please enter a description of the data you want to retrieve."
    
    cleaned = prompt.strip()
    if len(cleaned) < 3:
        return False, "Input is too short. Please provide a more meaningful description of the data you need (at least 3 characters)."
    
    # Check for obvious mutation intentions in natural language
    lower_prompt = cleaned.lower()
    for pattern in MUTATION_PROMPT_PATTERNS:
        if re.search(pattern, lower_prompt):
            return False, (
                "Action Declined: Data mutation requests (INSERT, UPDATE, DELETE, DROP, etc.) "
                "are strictly prohibited. Only read-only queries (SELECT) are permitted."
            )
    
    return True, None

def validate_sql_safety(sql: str) -> Tuple[bool, Optional[str]]:
    """
    Performs rigorous AST and token analysis to guarantee SQL is strictly read-only.
    Returns (is_safe, error_message).
    """
    if not sql or not sql.strip():
        return False, "SQL query cannot be empty."

    # Remove comments and strip
    cleaned = sqlparse.format(sql, strip_comments=True).strip()
    if not cleaned:
        return False, "SQL query cannot be empty after stripping comments."

    # Parse statements
    parsed = sqlparse.parse(cleaned)
    if not parsed:
        return False, "Unable to parse SQL query structure."

    if len(parsed) > 1:
        # Check if multiple queries are chained (e.g. SELECT 1; DROP TABLE users;)
        # Only allow 1 statement per execution
        return False, "Multiple SQL statements detected. Only a single read-only SELECT query is allowed per execution."

    stmt = parsed[0]
    stmt_type = stmt.get_type()

    # Allowed statement types: SELECT, or 'UNKNOWN' when starting with WITH (Common Table Expression)
    first_token = None
    for token in stmt.tokens:
        if not token.is_whitespace:
            first_token = token.value.upper()
            break

    if first_token == "WITH":
        # Validate that the CTE is followed by a SELECT
        if not re.search(r"\bSELECT\b", cleaned, re.IGNORECASE):
            return False, "Common Table Expressions (WITH ...) must terminate with a SELECT statement."
    elif stmt_type != "SELECT" and first_token != "SELECT" and first_token != "EXPLAIN":
        return False, (
            f"Action Declined: Statement type '{stmt_type or first_token}' is not permitted. "
            "Only read-only SELECT queries are allowed."
        )

    # Walk all tokens in the AST and disallow any forbidden keyword
    for token in stmt.flatten():
        val = token.value.upper()
        if val in FORBIDDEN_KEYWORDS:
            # Check context: If the word is inside string literals or identifiers, it might be allowed,
            # but sqlparse token type distinguishes literals from keywords!
            if token.ttype in sqlparse.tokens.Keyword or token.ttype in sqlparse.tokens.DML or token.ttype in sqlparse.tokens.DDL:
                return False, (
                    f"Action Declined: The query contains the forbidden keyword '{val}'. "
                    "Only read-only queries (SELECT) are permitted to maintain database safety."
                )

    # Double check regex for any dangerous statement patterns not caught by token flat list
    dangerous_regex = r"\b(INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM|DROP\s+(TABLE|VIEW|INDEX)|ALTER\s+TABLE|TRUNCATE\s+TABLE|REPLACE\s+INTO|CREATE\s+(TABLE|VIEW|INDEX))\b"
    if re.search(dangerous_regex, cleaned, re.IGNORECASE):
        return False, (
            "Action Declined: SQL contains a mutation pattern (INSERT, UPDATE, DELETE, DROP, etc.). "
            "Only read-only queries (SELECT) are permitted."
        )

    return True, None
