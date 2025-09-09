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
4. Run database migrations:
   ```bash
   python migrations/add_card_discount_column.py
   ```
5. Run the development server:
   ```bash
   python start_server.py
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

## New Features

### Card Discount System
- Customers can now have a discount percentage applied to their card
- When making card payments, the discount is automatically applied
- The discounted amount is deducted from the customer's card balance
- SMS notifications include discount information

### Fixes and Improvements
- Fixed customer data fetching integration between frontend and backend
- Improved card management API with proper validation
- Enhanced type safety for card_discount field
- Added database migration script for card_discount column

## Project Structure

```
backend/
├── app/
│   ├── api/            # API routes
│   ├── core/           # Core configuration
│   ├── db/            # Database configuration
│   ├── models/         # Database models
│   ├── services/       # Business logic
│   └── main.py         # FastAPI app entry point
├── migrations/         # Database migration scripts
├── requirements.txt
└── README.md
```