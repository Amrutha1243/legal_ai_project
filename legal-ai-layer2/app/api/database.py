from pymongo import MongoClient
import certifi

MONGO_URL = "mongodb+srv://Amrutha_1243:Amrutha%401243@legalai.rvs8uff.mongodb.net/?retryWrites=true&w=majority"

client = MongoClient(
    MONGO_URL,
    tlsCAFile=certifi.where()
)

db = client["legal_ai"]
users_collection = db["users"]   # ✅ ALWAYS defined
handoff_collection = db["handoff_cases"] # ✅ For User->Lawyer Handoff

try:
    client.admin.command("ping")
    print("✅ MongoDB connected successfully")
except Exception as e:
    print("❌ Failed to connect to MongoDB")
    print(e)
    