from app.database.mongo import policies_collection
from datetime import datetime, timedelta

def seed_policies():
    print("Starting Policy Seeding to MongoDB Atlas...")
    
    # Define a set of robust dummy policies (NORMALIZED for Node 3 matching)
    policies = [
        {
            "policyNumber": "MOT12345678",
            "policyType": "motor",
            "holderName": "JOHN SMITH",
            "effectiveDate": datetime(2025, 1, 1),
            "expiryDate": datetime(2026, 12, 31),
            "sumInsured": 500000.0,
            "coverageDetails": {
                "deductible": 5000.0,
                "limits": {
                    "ownDamage": 500000.0,
                    "thirdParty": 1000000.0
                }
            },
            "status": "ACTIVE"
        },
        {
            "policyNumber": "HEL99887766",
            "policyType": "health",
            "holderName": "ANKIT SHARMA",
            "effectiveDate": datetime(2024, 6, 1),
            "expiryDate": datetime(2025, 5, 31),
            "sumInsured": 1000000.0,
            "coverageDetails": {
                "deductible": 0.0,
                "limits": {
                    "roomRent": 5000.0,
                    "icuLimit": 10000.0,
                    "maternity": 50000.0
                }
            },
            "status": "ACTIVE"
        },
        {
            "policyNumber": "PRO11223344",
            "policyType": "property",
            "holderName": "MANSI JAGTAP",
            "effectiveDate": datetime(2025, 1, 1),
            "expiryDate": datetime(2025, 12, 31),
            "sumInsured": 2500000.0,
            "coverageDetails": {
                "deductible": 10000.0,
                "limits": {
                    "fire": 2500000.0,
                    "theft": 500000.0
                }
            },
            "status": "ACTIVE"
        },
        {
            "policyNumber": "CL2026311C50", 
            "policyType": "health",
            "holderName": "ANKIT SHARMA",
            "effectiveDate": datetime(2025, 1, 1),
            "expiryDate": datetime(2026, 12, 31),
            "sumInsured": 1500000.0,
            "coverageDetails": {
                "deductible": 2000.0,
                "limits": {
                    "ownDamage": 1500000.0
                }
            },
            "status": "ACTIVE"
        },
        {
            "policyNumber": "HFHEALTH2026778899", # Normalized from HFHEALTH-2026-778899
            "policyType": "health",
            "holderName": "Rohan Anil Mehta".upper(),
            "effectiveDate": datetime(2026, 1, 1),
            "expiryDate": datetime(2026, 12, 31),
            "sumInsured": 500000.0,
            "coverageDetails": {
                "deductible": 1000.0,
                "limits": {
                    "ownDamage": 500000.0,
                    "icuLimit": 50000.0
                }
            },
            "patient_details": { # Storing extra metadata from the JSON
                "gender": "Male",
                "dob": "1991-03-14",
                "phone": "+918876543456",
                "email": "45678814@gmail.com"
            },
            "status": "ACTIVE"
        }
    ]

    for p in policies:
        result = policies_collection.update_one(
            {"policyNumber": p["policyNumber"]},
            {"$set": p},
            upsert=True
        )
        if result.upserted_id:
            print(f"Inserted new policy: {p['policyNumber']}")
        else:
            print(f"Updated existing policy: {p['policyNumber']}")

    print("Seeding completed successfully.")

if __name__ == "__main__":
    seed_policies()
