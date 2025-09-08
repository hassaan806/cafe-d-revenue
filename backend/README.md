# FastAPI Backend for Cafe Revenue Management System

## Setup Instructions

1. Install Python 3.8+ and pip
2. Create a virtual environment:
   ```bash
   python -m venv venv
   venv\Scripts\activate  # On Windows
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the development server:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

## API Documentation

Once running, visit:
- API Documentation: http://localhost:8000/docs
- Alternative Docs: http://localhost:8000/redoc

## Environment Variables

Create a `.env` file in the backend directory with:
```
DATABASE_URL=sqlite:///./cafe_revenue.db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## Project Structure

```
backend/
├── app/
│   ├── api/            # API routes
│   ├── core/           # Core configuration
│   ├── db/            # Database configuration
│   ├── models/        # Database models
│   ├── services/      # Business logic
│   └── main.py        # FastAPI app entry point
├── requirements.txt
└── README.md
```