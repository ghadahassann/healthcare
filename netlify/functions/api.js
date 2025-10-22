const { MongoClient } = require('mongodb');

exports.handler = async (event) => {
  console.log('🔍 API Called:', event.path);
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const MONGODB_URI = process.env.MONGODB_URI;
  
  console.log('🔧 MONGODB_URI exists:', !!MONGODB_URI);
  console.log('🔧 URI starts with:', MONGODB_URI ? MONGODB_URI.substring(0, 20) + '...' : 'NULL');

  if (!MONGODB_URI) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'MongoDB URI not configured',
        message: 'Check Netlify Environment Variables'
      })
    };
  }

  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔗 Attempting MongoDB connection...');
    await client.connect();
    console.log('✅ MongoDB connected successfully!');
    
    const db = client.db();
    const collections = await db.listCollections().toArray();
    console.log('📁 Available collections:', collections.map(c => c.name));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        status: 'OK', 
        database: 'Connected to MongoDB',
        collections: collections.map(c => c.name),
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: 'MongoDB connection failed: ' + error.message
      })
    };
  } finally {
    await client.close();
  }
};