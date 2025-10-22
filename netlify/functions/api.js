const { MongoClient } = require('mongodb');

exports.handler = async (event) => {
  console.log('🚨 API Called:', {
    path: event.path,
    rawPath: event.rawPath,
    httpMethod: event.httpMethod,
    fullPath: event.rawUrl
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

  // 🔥 FIX: استخدام rawPath بدل path
  const rawPath = event.rawPath || event.path;
  const path = rawPath.replace('/.netlify/functions/api', '');
  
  console.log('🔧 Processed Path:', path);

  const MONGODB_URI = process.env.MONGODB_URI;

  // 🎯 HEALTH CHECK - بدون MongoDB
  if (path === '/health' || path === '' || path === '/') {
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

  // 🎯 SIMPLE TEST ENDPOINT
  if (path === '/test' && event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        message: 'Test endpoint is working!',
        path: path
      })
    };
  }

  // 🎯 PATIENTS - أبسط نسخة
  if (path === '/patients' && event.httpMethod === 'GET') {
    if (!MONGODB_URI) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          count: 2, 
          data: [
            { name: 'Test Patient 1', age: 25, gender: 'male' },
            { name: 'Test Patient 2', age: 30, gender: 'female' }
          ],
          message: 'Using mock data - MongoDB not connected'
        })
      };
    }

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
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          count: 0, 
          data: [],
          error: 'Database connection failed, using empty data'
        })
      };
    }
  }

  // ❌ ENDPOINT NOT FOUND - مع تفاصيل أكثر
  return {
    statusCode: 404,
    headers,
    body: JSON.stringify({ 
      success: false,
      error: 'Endpoint not found',
      details: {
        requestedPath: path,
        httpMethod: event.httpMethod,
        rawPath: event.rawPath,
        availableEndpoints: [
          'GET /api/health',
          'GET /api/test', 
          'GET /api/patients',
          'POST /api/seed'
        ]
      }
    })
  };
};