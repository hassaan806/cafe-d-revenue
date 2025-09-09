import sys
import os

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import the app
from app.main import app
import uvicorn

if __name__ == "__main__":
    print("Starting backend server...")
    print("Server will be available at http://127.0.0.1:9000")
    print("Documentation available at http://127.0.0.1:9000/docs")
    uvicorn.run(app, host="127.0.0.1", port=9000)