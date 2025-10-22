// netlify/functions/api.js - نسخة مبسطة بدون express
const { MongoClient } = require('mongodb');

exports.handler = async (event) => {
  const path = event.path.replace('/.netlify/functions/api', '');
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();

    // Routes
    if (path === '/health' || path === '') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          status: 'OK', 
          message: 'Healthcare API is running!',
          timestamp: new Date().toISOString()
        })
      };
    }

    if (path === '/patients' && event.httpMethod === 'GET') {
      const patients = await db.collection('patients').find().toArray();
      await client.close();
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, data: patients })
      };
    }

    if (path === '/patients' && event.httpMethod === 'POST') {
      const patient = JSON.parse(event.body);
      const result = await db.collection('patients').insertOne(patient);
      await client.close();
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ 
          success: true, 
          message: 'Patient created',
          data: { ...patient, _id: result.insertedId }
        })
      };
    }

    await client.close();
    
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Endpoint not found' })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};