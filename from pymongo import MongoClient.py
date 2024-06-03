from pymongo import MongoClient
import math

# Replace these variables with your MongoDB connection details
mongo_uri = 'mongodb+srv://Zohaib24648:Zohaib24648@userlogins.94nzbbm.mongodb.net/'  # Your MongoDB connection string
database_name = 'test'         # Your database name
collection_name = 'teachers'     # Your collection name

# Connect to MongoDB
client = MongoClient(mongo_uri)
db = client[database_name]
collection = db[collection_name]

# Manual handling of NaN values since MongoDB does not directly support querying NaN
documents = collection.find()
count = 0

for doc in documents:
    # Check if 'Specialization' exists and is NaN
    if 'Specialization' in doc and isinstance(doc['Specialization'], float) and math.isnan(doc['Specialization']):
        # Perform update where NaN is found
        result = collection.update_one(
            {'_id': doc['_id']},
            {'$set': {'Specialization': ""}}
        )
        if result.modified_count > 0:
            count += result.modified_count

# Output the result
print(f"Documents modified: {count}")

# Close the connection
client.close()