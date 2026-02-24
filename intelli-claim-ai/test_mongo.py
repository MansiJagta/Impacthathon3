import os
import socket
from app.database.mongo import policies_collection, MONGO_URI

print(f"Connecting to MongoDB with URI: {MONGO_URI}")

# Test direct DNS resolution for shards
shards = [
    "ac-qdgpemg-shard-00-00.z5921d6.mongodb.net",
    "ac-qdgpemg-shard-00-01.z5921d6.mongodb.net",
    "ac-qdgpemg-shard-00-02.z5921d6.mongodb.net"
]

for shard in shards:
    try:
        ip = socket.gethostbyname(shard)
        print(f"DNS Success: {shard} -> {ip}")
    except Exception as e:
        print(f"DNS Failed for {shard}: {e}")

try:
    p = policies_collection.find_one()
    if p:
        print(f"Success! Found a policy: {p.get('policyNumber')}")
    else:
        print("Success! Connected, but no policies found in the collection.")
except Exception as e:
    print(f"Failed to connect: {e}")

