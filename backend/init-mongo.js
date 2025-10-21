// Initialize MongoDB with sample data
db = db.getSiblingDB('healthcare');

// Create collections
db.createCollection('patients');
db.createCollection('appointments');
db.createCollection('medicalrecords');
db.createCollection('users');

print('✅ Healthcare database initialized!');