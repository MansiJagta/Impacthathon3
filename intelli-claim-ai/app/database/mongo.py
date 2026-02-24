from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)

# main system DB
insurance_db = client["insurance_db"]
policies_collection = insurance_db["policies"]
claims_collection = insurance_db["claims"]

# ⭐ HITL DATABASE (NEW)
hitl_db = client["hitl_db"]
high_risk_claims_collection = hitl_db["high_risk_claims"]

# ⭐ FRAUD CLASSIFICATION DATABASE
fraud_classification_db = client["fraud_classification_db"]
fraud_classification_collection = fraud_classification_db["fraud_classificaton_data"]