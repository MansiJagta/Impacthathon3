from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

# Enhanced MongoClient for robustness on Windows/Local environments
client = MongoClient(
    MONGO_URI,
    serverSelectionTimeoutMS=30000,
    connectTimeoutMS=30000,
    socketTimeoutMS=30000
)

# Explicitly test connection on startup
try:
    client.admin.command('ping')
    print("SUCCESS: MongoDB connection established successfully.")
except Exception as e:
    print(f"ERROR: MongoDB connection failed: {e}")


# main system DB
insurance_db = client["insurance_db"]
policies_collection = insurance_db["policies"]
claims_collection = insurance_db["claims"]

# ⭐ HITL DATABASE (NEW)
hitl_db = client["hitl_db"]
high_risk_claims_collection = hitl_db["high_risk_claims"]
