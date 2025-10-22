const { MongoClient } = require('mongodb');

exports.handler = async (event) => {
  console.log('🔍 API Called:', event.path, event.httpMethod);
  
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const path = event.path.replace('/.netlify/functions/api', '');
  const MONGODB_URI = process.env.MONGODB_URI;

  // 🔍 HEALTH CHECK - أبسط نسخة
  if (path === '/health' || path === '') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        status: 'OK', 
        message: 'API is working'
      })
    };
  }

  // 👥 PATIENTS - أبسط نسخة
  if (path === '/patients' && event.httpMethod === 'GET') {
    try {
      const client = new MongoClient(MONGODB_URI);
      await client.connect();
      const patients = await client.db().collection('patients').find().toArray();
      await client.close();
      
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

  // 🌱 SEED - أبسط نسخة
  if (path === '/seed' && event.httpMethod === 'POST') {
    try {
      const client = new MongoClient(MONGODB_URI);
      await client.connect();
      const db = client.db();
      
      // Sample data
      const patient = {
        name: 'Test Patient',
        age: 30,
        gender: 'male',
        phone: '+1234567890',
        email: 'test@email.com',
        createdAt: new Date()
      };
      
      const result = await db.collection('patients').insertOne(patient);
      await client.close();
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Database seeded with test data!',
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
      path: path,
      method: event.httpMethod
    })
  };
};