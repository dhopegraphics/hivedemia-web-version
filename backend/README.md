# 🧠 HIVEDEMIA – Educational Platform Backend

HIVEDEMIA is a FastAPI + PostgreSQL backend powering an AI-driven educational platform. Features include competitions, shared notes, topic extraction, notifications, and more.

---

## 🚀 Tech Stack

- **FastAPI** – lightning-fast API framework
- **PostgreSQL** – reliable relational DB
- **SQLAlchemy (Async)** – database ORM
- **asyncpg** – PostgreSQL async driver
- **Pydantic** – schema validation
- **Alembic** – DB migrations

---

## 📁 Project Structure

backend/
├── app/
│ ├── api/ # Route handlers
│ ├── crud/ # DB interaction logic
│ ├── models/ # SQLAlchemy ORM models
│ ├── schemas/ # Pydantic request/response schemas
│ └── database/ # DB connection setup
├── main.py # FastAPI app entry point
├── requirements.txt # Python dependencies
├── README.md # Project documentation
└── .env # Environment variables (excluded from Git)


---

## ⚙️ Environment Setup

### 1. Clone and install dependencies

```bash

cd backend
py -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
