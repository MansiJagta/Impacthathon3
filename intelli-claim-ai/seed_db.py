import os
import sys
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Add app directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))

from app.database.mongo import policies_collection

def seed_policies():
    print("Seeding sample policies...")
    
    # Clean existing policies
    policies_collection.delete_many({})
    
    sample_policies = [
        {
            "policyNumber": "POL12345",
            "holderName": "John Doe",
            "effectiveDate": datetime.utcnow() - timedelta(days=100),
            "expiryDate": datetime.utcnow() + timedelta(days=265),
            "sumInsured": 500000,
            "coverageDetails": {
                "deductible": 5000,
                "limits": {
                    "ownDamage": 450000,
                    "thirdParty": 1000000
                }
            },
            "exclusions": ["Alcohol induced", "Racing", "Intentional damage"]
        },
        {
            "policyNumber": "POL98765",
            "holderName": "Jane Smith",
            "effectiveDate": datetime.utcnow() - timedelta(days=400),
            "expiryDate": datetime.utcnow() - timedelta(days=35), # EXPIRED
            "sumInsured": 200000,
            "coverageDetails": {
                "deductible": 2000,
                "limits": {
                    "ownDamage": 180000
                }
            },
            "exclusions": ["Commercial use", "Alcohol"]
        },
        {
            "policyNumber": "ID-A789B",
            "holderName": "Robert Wilson",
            "effectiveDate": datetime.utcnow() - timedelta(days=10),
            "expiryDate": datetime.utcnow() + timedelta(days=355),
            "sumInsured": 1000000,
            "coverageDetails": {
                "deductible": 0,
                "limits": {
                    "ownDamage": 1000000
                }
            },
            "exclusions": []
        }
    ]
    
    result = policies_collection.insert_many(sample_policies)
    print(f"Successfully seeded {len(result.inserted_ids)} policies.")

if __name__ == "__main__":
    load_dotenv()
    seed_policies()
