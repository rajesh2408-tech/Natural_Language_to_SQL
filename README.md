# NL2SQL Studio — Natural Language to SQL Engine

> A production-grade, full-stack Natural Language to SQL query engine with a live interactive execution interface, schema introspection, dynamic table renderer, session recall history, and multi-tier security barriers. Powered by **Google Gemini** and **SQLite / MySQL**.

---

## 📋 Table of Contents
1. [Overview & Architecture](#-overview--architecture)
2. [Prerequisites & Quick Start](#-prerequisites--quick-start)
3. [Database Schema & Design](#-database-schema--design)
4. [Core Features & Requirements](#-core-features--requirements)
5. [Edge Cases & Security Protection](#-edge-cases--security-protection)
6. [Bonus Features](#-bonus-features)
7. [Query Speed & Caching Strategy (Technical Writeup)](#-query-speed--caching-strategy-technical-writeup)
8. [Technologies Used & Why](#-technologies-used--why)
9. [Verification & Benchmark Queries](#-verification--benchmark-queries)
10. [Assumptions & Trade-offs](#-assumptions--trade-offs)

---

## 🚀 Overview & Architecture

NL2SQL Studio enables non-technical and technical users alike to query relational databases using everyday English. The system translates plain English requests into optimized SQL, displays the generated statement with clear architectural interpretations, executes it safely against a live database, and visualizes the output in a responsive, paginated, and exportable data table.

### Architecture Flow

```
[ User Input in Plain English ]
             │
             ▼
[ Input Validator & Intent Barrier ] ──(Block empty / short / mutations)
             │ (Valid Read Intent)
             ▼
[ Gemini 3.8 / Flash Lite Engine ] ◄── Schema Context & Dialect Rules
             │
             ▼
[ Generated SQL + Syntax Display ] ──► [ Optional User In-Place Editing ]
             │
             ▼
[ SQL AST Parser & Token Guard ] ──(Block DDL / DML / Mutating Keywords)
             │ (Safe SELECT)
             ▼
[ Database Manager (SQLite / MySQL) ]
             │
             ▼
[ Structured Results Display & Session History ]
  ├── Dynamic Column Headers
  ├── Row Count & Latency Metrics (<2ms)
  ├── Search & Multi-Page Pagination
  ├── One-Click CSV / JSON Export
  └── Session History Drawer with 1-Click State Recall
```

---

## ⚡ Prerequisites & Quick Start

### Prerequisites
- **Python**: 3.10+ (tested with Python 3.13)
- **Node.js**: 18+ (tested with Node v24)
- **SQLite3**: Pre-installed on macOS/Linux/Windows

### 1. One-Command Automatic Setup (Recommended)

Simply execute the unified startup script:
```bash
./run.sh
```
This script automatically:
1. Creates the Python virtual environment (`venv`).
2. Installs backend dependencies (`fastapi`, `uvicorn`, `sqlparse`, `pydantic`).
3. Seeds the database with **499+ realistic rows** across 5 relational tables.
4. Compiles the modern React frontend.
5. Launches the unified server on **http://localhost:8000**.

Open your browser to:
- **Web Interface:** [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 2. Manual Step-by-Step Setup

#### Backend Setup
```bash
# 1. Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 2. Install backend dependencies
pip install -r requirements.txt

# 3. Seed database with realistic sample data
python3 -m backend.seed_data

# 4. Start FastAPI backend
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Frontend Setup (for development)
```bash
cd frontend
npm install
npm run build   # Or 'npm run dev' to launch Vite dev server at http://localhost:3000
```

---

## 🗄 Database Schema & Design

An **E-Commerce & Organization Operations Schema** was chosen because it models complex real-world data patterns: multi-table foreign keys, one-to-many relationships, time-series transactions, aggregations, and departmental hierarchies.

### Entity-Relationship Diagram

```
┌─────────────────────────┐
│          users          │
├─────────────────────────┤
│ id (PK)                 │◄────────┐
│ name                    │         │
│ email (UNIQUE)          │         │
│ role                    │         │
│ department              │         │
│ hired_at                │         │
│ country                 │         │
│ created_at              │         │
└────────────┬────────────┘         │
             │                      │
             │ 1:N                  │ 1:N
             ▼                      │
┌─────────────────────────┐         │
│         orders          │         │
├─────────────────────────┤         │
│ id (PK)                 │         │
│ customer_id (FK) ───────┼─────────┘
│ order_date              │
│ status                  │
│ total_amount            │
│ shipping_city           │
│ created_at              │
└────────────┬────────────┘
             │
             │ 1:N
             ▼
┌─────────────────────────┐       ┌─────────────────────────┐
│       order_items       │       │        products         │
├─────────────────────────┤       ├─────────────────────────┤
│ id (PK)                 │       │ id (PK)                 │◄───┐
│ order_id (FK)           │       │ name                    │    │
│ product_id (FK) ────────┼──────►│ category                │    │
│ quantity                │       │ price                   │    │
│ unit_price              │       │ stock_quantity          │    │ 1:N
│ subtotal                │       │ sku (UNIQUE)            │    │
└─────────────────────────┘       │ created_at              │    │
                                  └────────────┬────────────┘    │
                                               │                 │
                                               │ 1:N             │
                                               ▼                 │
                                  ┌─────────────────────────┐    │
                                  │         reviews         │    │
                                  ├─────────────────────────┤    │
                                  │ id (PK)                 │    │
                                  │ product_id (FK) ────────┼────┘
                                  │ user_id (FK) ───────────┼────► users(id)
                                  │ rating (1-5)            │
                                  │ comment                 │
                                  │ created_at              │
                                  └─────────────────────────┘
```

### Table Specifications & Volume

| Table Name | Rows Seeded | Primary Key | Key Foreign Keys | Purpose & Evaluation Role |
| :--- | :---: | :---: | :--- | :--- |
| **`users`** | **70** | `id` | None | User directory with mixed roles (Customers, Software Engineers, DevOps, Managers) and hire dates across 2019–2025. Satisfies *"Show all employees in Engineering hired after 2022"*. |
| **`products`** | **60** | `id` | None | Electronics, Audio, Office, and Wearable products with varying prices and stock levels. **10 products are explicitly zero-stock** to test *"How many products are out of stock?"*. |
| **`orders`** | **85** | `id` | `customer_id → users.id` | Order transactions across 2025–2026. **28 orders placed in the last 30 days** to evaluate *"Orders placed in the last 30 days"*. |
| **`order_items`**| **219**| `id` | `order_id → orders.id`, `product_id → products.id` | Line items with quantity, unit prices, and calculated subtotals for multi-level join queries. |
| **`reviews`** | **65** | `id` | `product_id → products.id`, `user_id → users.id` | Customer feedback ratings (1–5 stars) with realistic qualitative feedback. |
| **Total** | **499** | — | — | **Exceeds requirement of at least 3 tables with 50+ rows each.** |

---

## 🎯 Core Features & Requirements

### Part 1 — Natural Language Input
- Clean input bar with auto-submit on `Enter`.
- Built-in one-click benchmark query chips for immediate testing.
- Input validation blocks inputs shorter than 3 characters or whitespace-only submissions with helpful corrective guidance.

### Part 2 — SQL Generation & Display
- Schema-aware prompt injected with table names, data types, primary/foreign key relationships, and SQLite date functions (`date('now', '-30 days')`, `strftime('%Y', hired_at)`).
- Clear monospace syntax display with copy-to-clipboard button and model provenance pill (`gemini-flash-lite-latest`).
- Explicit **Interpretation & Assumptions** drawer clarifying how ambiguous natural language terms were resolved.

### Part 3 — Safe Live Query Execution
- Safely runs generated queries against the real seeded database.
- Sub-millisecond execution times displayed in real time (e.g. `0.85 ms`).
- Re-seed button in the navbar resets the database to pristine state at any time.

### Part 4 — Dynamic Results Display
- Column headers derived dynamically from query metadata.
- Row count indicators (e.g. `Showing 28 results`, `Showing 10 of 70 rows`).
- Pagination controls with selectable page size (`10`, `25`, `50`, `100` rows/page) and first/last page shortcuts.
- Real-time client-side search filter across all columns.

### Part 5 — Query History with Session Recall
- Running query history tracked in a dedicated sidebar drawer.
- Captures prompt, SQL, status, duration, row count, and execution timestamp.
- **One-Click Session Recall:** Clicking any history record instantly restores the original prompt, the generated SQL, and the exact table results without re-executing.

---

## 🛡 Edge Cases & Security Protection

| Edge Case Scenario | Expected Behavior | Implementation & Safety Mechanism |
| :--- | :--- | :--- |
| **Vague or ambiguous prompt** | Reasonable attempt with clear interpretation. | Model makes best-effort query; UI surfaces an *"Interpretation & Assumptions"* banner explaining filter conditions. |
| **Referenced table/column does not exist** | Human-readable error, not raw DB trace. | Catches database exceptions and translates them (e.g. *"Table 'customers' does not exist. Available tables are: users, products, orders, order_items, reviews."*). |
| **Query returns zero rows** | Clear confirmation without breaking table. | Renders an informational success banner: *"Query executed successfully, but returned 0 results matching your criteria."* |
| **Mutation Attempt (`INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `TRUNCATE`)** | Intent detected, declined with read-only notice. | **Dual-Layer Barrier:** 1) NLP Intent regex stops prompt before LLM call; 2) SQL AST Parser (`sqlparse`) inspects tokens and forbids DDL/DML keywords. |
| **Input empty or too short (<3 chars)** | Submission blocked with helpful prompt. | Client-side and server-side validation rejects empty or < 3 char inputs with a descriptive warning banner. |

---

## 🎁 Bonus Features

1. **In-Place Editable SQL Before Execution**
   - Click **"Edit Query"** to switch the SQL viewer into a live editor.
   - Modify column projections, `WHERE` clauses, or `LIMIT` counts, then click **"Execute Edited SQL"**.
   - Results update immediately and the edited query is flagged in session history.

2. **Query Result Export (CSV & JSON)**
   - Download the current result set as a formatted CSV file (`query_results.csv`) with RFC 4180 escaping.
   - Download results as structured JSON (`query_results.json`).

3. **Interactive Schema Explorer**
   - Collapsible left sidebar listing all 5 tables and live row counts.
   - Expand tables to inspect column names, data types, Primary Key (`Key` icon), and Foreign Key (`Link` icon) relationships.
   - **Sample Data Preview:** Inspect the first 3 rows of any table directly inside the sidebar.
   - Click column names to copy them to the clipboard.

4. **Speed & Caching Strategy Modal**
   - Dedicated navbar button opening the technical architecture writeup.

---

## ⚡ Query Speed & Caching Strategy (Technical Writeup)

> *Word count: 161 words (Limit: max 200 words)*

To accelerate repeated and similar natural language queries, I would introduce a two-tier caching architecture:

1. **Exact Query Cache (Redis):** For identical SQL queries, compute a SHA-256 hash of the normalized SQL query string. Return pre-computed JSON results directly from in-memory Redis with sub-millisecond latency (O(1) lookup), bypassing both LLM generation and database execution.

2. **Semantic & Parameterized Cache:** For semantically similar NL requests (e.g. *"show users"* vs *"list users"*), normalize the AST or compute dense vector embeddings with cosine similarity > 0.95 to reuse cached query plans and compiled statements. For heavy analytical queries (e.g. customer lifetime spend), leverage Materialized Views refreshed periodically or incrementally.

**Trade-offs:**
- **Staleness vs. Freshness:** Fast cached reads risk serving stale data if recent writes occur before invalidation.
- **Invalidation Overhead:** Event-driven cache invalidation (via Change Data Capture or write-through hooks) increases system complexity.
- **Memory Consumption:** In-memory result stores require strict LRU eviction policies and TTL boundaries to prevent unbounded RAM growth.

---

## 🛠 Technologies Used & Why

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **LLM Engine** | **Google Gemini (`gemini-flash-lite-latest`)** | Sub-6s latency with zero thinking overhead, superior SQL schema comprehension, and JSON formatting reliability. |
| **Backend API** | **FastAPI (Python 3.13)** | Asynchronous ASGI performance, automatic OpenAPI documentation, tight integration with Python SQL parsing tools. |
| **SQL AST Security** | **`sqlparse` + Regex Guards** | Robust abstract syntax tree parsing to enforce read-only semantics (`SELECT`) and block command chaining or SQL injection. |
| **Database** | **SQLite (with MySQL compatibility)** | Zero-dependency, file-backed ACID relational database ideal for reproducible local evaluation. Connection pooling and MySQL/Postgres support configurable via `.env`. |
| **Frontend UI** | **React 19 + Vite 6** | Instant hot-module replacement, high rendering performance for data grids, and component reusability. |
| **Styling & Icons** | **Tailwind CSS v4 + Lucide React** | Sleek developer-studio aesthetics (dark mode, typography, responsive sidebars) and accessible iconography. |

---

## 🧪 Verification & Benchmark Queries

All required benchmark queries from the technical assessment specification have been tested and verified:

| # | Benchmark Prompt | Generated SQL | Seeded Results | Execution Time |
| :---: | :--- | :--- | :---: | :---: |
| **1** | *"List all users"* | `SELECT id, name, email, role, department, hired_at, country, created_at FROM users;` | **70 rows** | ~1.2 ms |
| **2** | *"Show me all orders placed in the last 30 days"* | `SELECT * FROM orders WHERE order_date >= date('now', '-30 days');` | **28 rows** | ~0.9 ms |
| **3** | *"How many products are out of stock?"* | `SELECT COUNT(*) AS out_of_stock_count FROM products WHERE stock_quantity = 0;` | **1 row** (`count: 10`) | ~0.7 ms |
| **4** | *"Find the top 5 customers by total spend"* | `SELECT u.id, u.name, u.email, ROUND(SUM(o.total_amount), 2) AS total_spend FROM users u JOIN orders o ON u.id = o.customer_id GROUP BY u.id ORDER BY total_spend DESC LIMIT 5;` | **5 rows** | ~1.5 ms |
| **5** | *"Show all employees in the Engineering department hired after 2022"* | `SELECT * FROM users WHERE department = 'Engineering' AND strftime('%Y', hired_at) > '2022';` | **12 rows** | ~0.8 ms |

---

## ⚙️ Assumptions & Trade-offs

1. **Database Engine Choice (SQLite by default):**
   - *Assumption:* SQLite was selected as the default local engine to ensure zero-setup execution without requiring an active external daemon process.
   - *Flexibility:* MySQL and PostgreSQL connection parameters (including password `123456`) are fully supported via `DB_TYPE=mysql` or `DB_TYPE=postgresql` in `.env`.
2. **Date Arithmetic Interpretation:**
   - *Assumption:* "Last 30 days" evaluates against SQLite's `date('now', '-30 days')`. The sample seed dates are positioned relative to present time so that realistic orders are always returned.
3. **Dual-Layer Mutation Barrier:**
   - *Trade-off:* Proactively declining queries containing mutation keywords in natural language prevents wasteful LLM token usage and protects database integrity, but may disallow hypothetical benign phrases containing words like *"drop"* or *"delete"*. This trade-off heavily favors security and compliance.
