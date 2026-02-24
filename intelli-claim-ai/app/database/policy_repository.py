from typing import Any, List, Optional
from app.database.mongo import policies_collection

def create_policy(policy_data: dict[str, Any]) -> str:
    """
    Creates a new policy record.
    """
    result = policies_collection.insert_one(policy_data)
    return str(result.inserted_id)

def get_policy(policy_number: str) -> Optional[dict[str, Any]]:
    """
    Retrieves a policy by its policy number.
    """
    return policies_collection.find_one({"policyNumber": policy_number}, {"_id": 0})

def list_policies(limit: int = 50) -> List[dict[str, Any]]:
    """
    Lists all policies.
    """
    return list(policies_collection.find({}, {"_id": 0}).limit(limit))

def delete_policy(policy_number: str) -> bool:
    """
    Deletes a policy by its policy number.
    """
    result = policies_collection.delete_one({"policyNumber": policy_number})
    return result.deleted_count > 0

def update_policy(policy_number: str, update_data: dict[str, Any]) -> bool:
    """
    Updates an existing policy.
    """
    result = policies_collection.update_one(
        {"policyNumber": policy_number},
        {"$set": update_data}
    )
    return result.matched_count > 0
