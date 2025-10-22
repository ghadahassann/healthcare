const { MongoClient } = require('mongodb');

exports.handler = async (event) => {
  console.log('🚨 API Called:', {
    path: event.path,
    rawPath: event.rawPath,
    httpMethod: event.httpMethod
  });

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // 🔥 FIX: استخدمي الـ path كما هو بدون تعديل
  const path = event.path;
  console.log('🔧 Raw Path:', path);

  const MONGODB_URI = process.env.MONGODB_URI;

  // 🎯 HEALTH CHECK
  if (path === '/api/health' || path === '/.netlify/functions/api' || path === '/api') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        status: 'OK', 
        message: 'API Health Check Working!',
        timestamp: new Date().toISOString(),
        path: path
      })
    };
  }

  // 🎯 PATIENTS ENDPOINT
  if (path === '/api/patients' && event.httpMethod === 'GET') {
    console.log('👥 Patients endpoint called');
    
    if (!MONGODB_URI) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          count: 2, 
          data: [
            { _id: '1', name: 'Test Patient 1', age: 25, gender: 'male', condition: 'Stable' },
            { _id: '2', name: 'Test Patient 2', age: 30, gender: 'female', condition: 'Good' }
          ],
          message: 'Using mock data - MongoDB URI not configured'
        })
      };
    }

    try {
      console.log('🔗 Connecting to MongoDB...');
      const client = new MongoClient(MONGODB_URI);
      await client.connect();
      console.log('✅ MongoDB connected');
      
      const patients = await client.db().collection('patients').find().toArray();
      await client.close();
      
      console.log(`📊 Found ${patients.length} patients`);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          count: patients.length, 
          data: patients 
        })
      };
    } catch (error) {
      console.error('❌ MongoDB error:', error);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          count: 0, 
          data: [],
          error: 'Database connection failed: ' + error.message
        })
      };
    }
  }

  // 🎯 SEED ENDPOINT
  if (path === '/api/seed' && event.httpMethod === 'POST') {
    if (!MONGODB_URI) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: 'MongoDB URI not configured'
        })
      };
    }

    try {
      const client = new MongoClient(MONGODB_URI);
      await client.connect();
      const db = client.db();
      
      // Sample patient
      const patient = {
        name: 'John Smith',
        age: 45,
        gender: 'male',
        phone: '+1234567890',
        email: 'john@email.com',
        condition: 'Stable',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await db.collection('patients').insertOne(patient);
      await client.close();
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Database seeded with sample data!',
          patient: { ...patient, _id: result.insertedId }
        })
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: error.message 
        })
      };
    }
  }

  // ❌ ENDPOINT NOT FOUND
  return {
    statusCode: 404,
    headers,
    body: JSON.stringify({ 
      success: false,
      error: 'Endpoint not found',
      details: {
        requestedPath: path,
        httpMethod: event.httpMethod,
        availableEndpoints: [
          'GET /api/health',
          'GET /api/patients',
          'POST /api/seed'
        ]
      }
    })
  };
};