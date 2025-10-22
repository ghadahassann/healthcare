const { MongoClient, ObjectId } = require('mongodb');

exports.handler = async (event) => {
  console.log('🚨 API Called:', {
    path: event.path,
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

  const path = event.path;
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
        timestamp: new Date().toISOString()
      })
    };
  }

  // 👥 PATIENTS - GET ALL
  if (path === '/api/patients' && event.httpMethod === 'GET') {
    return handleGetPatients(MONGODB_URI, headers);
  }

  // 👥 PATIENTS - CREATE
  if (path === '/api/patients' && event.httpMethod === 'POST') {
    return handleCreatePatient(MONGODB_URI, event.body, headers);
  }

  // 👥 PATIENTS - GET BY ID
  if (path.startsWith('/api/patients/') && event.httpMethod === 'GET') {
    const id = path.split('/')[3];
    return handleGetPatientById(MONGODB_URI, id, headers);
  }

  // 👥 PATIENTS - UPDATE
  if (path.startsWith('/api/patients/') && event.httpMethod === 'PUT') {
    const id = path.split('/')[3];
    return handleUpdatePatient(MONGODB_URI, id, event.body, headers);
  }

  // 👥 PATIENTS - DELETE
  if (path.startsWith('/api/patients/') && event.httpMethod === 'DELETE') {
    const id = path.split('/')[3];
    return handleDeletePatient(MONGODB_URI, id, headers);
  }

  // 📅 APPOINTMENTS - GET ALL
  if (path === '/api/appointments' && event.httpMethod === 'GET') {
    return handleGetAppointments(MONGODB_URI, headers);
  }

  // 📅 APPOINTMENTS - CREATE
  if (path === '/api/appointments' && event.httpMethod === 'POST') {
    return handleCreateAppointment(MONGODB_URI, event.body, headers);
  }

  // 🏥 MEDICAL STATS
  if (path === '/api/medical' && event.httpMethod === 'GET') {
    return handleGetMedicalStats(MONGODB_URI, headers);
  }

  // 🌱 SEED DATABASE
  if (path === '/api/seed' && event.httpMethod === 'POST') {
    return handleSeedDatabase(MONGODB_URI, headers);
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
          'GET    /api/health',
          'GET    /api/patients',
          'POST   /api/patients',
          'GET    /api/patients/:id',
          'PUT    /api/patients/:id',
          'DELETE /api/patients/:id',
          'GET    /api/appointments',
          'POST   /api/appointments',
          'GET    /api/medical',
          'POST   /api/seed'
        ]
      }
    })
  };
};

// 👥 PATIENTS HANDLERS
async function handleGetPatients(MONGODB_URI, headers) {
  if (!MONGODB_URI) {
    return mockPatients(headers);
  }

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const patients = await client.db().collection('patients').find().sort({ createdAt: -1 }).toArray();
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
    return mockPatients(headers, error.message);
  }
}

async function handleCreatePatient(MONGODB_URI, body, headers) {
  if (!MONGODB_URI) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: 'MongoDB not configured'
      })
    };
  }

  try {
    const patientData = JSON.parse(body);
    const patient = {
      ...patientData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const result = await client.db().collection('patients').insertOne(patient);
    await client.close();
    
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'Patient created successfully',
        data: { ...patient, _id: result.insertedId }
      })
    };
  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: error.message 
      })
    };
  }
}

async function handleGetPatientById(MONGODB_URI, id, headers) {
  if (!MONGODB_URI) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ 
        success: false,
        message: 'Patient not found - MongoDB not configured'
      })
    };
  }

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const patient = await client.db().collection('patients').findOne({ _id: new ObjectId(id) });
    await client.close();
    
    if (!patient) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Patient not found' 
        })
      };
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        data: patient 
      })
    };
  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Invalid patient ID' 
      })
    };
  }
}

async function handleUpdatePatient(MONGODB_URI, id, body, headers) {
  if (!MONGODB_URI) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: 'MongoDB not configured'
      })
    };
  }

  try {
    const updateData = JSON.parse(body);
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const result = await client.db().collection('patients').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      }
    );
    
    await client.close();
    
    if (result.matchedCount === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Patient not found' 
        })
      };
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'Patient updated successfully' 
      })
    };
  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: error.message 
      })
    };
  }
}

async function handleDeletePatient(MONGODB_URI, id, headers) {
  if (!MONGODB_URI) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: 'MongoDB not configured'
      })
    };
  }

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    // احذفي المريض
    const result = await client.db().collection('patients').deleteOne({ _id: new ObjectId(id) });
    
    // احذفي مواعيده
    await client.db().collection('appointments').deleteMany({ patientId: id });
    
    await client.close();
    
    if (result.deletedCount === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Patient not found' 
        })
      };
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'Patient deleted successfully' 
      })
    };
  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Invalid patient ID' 
      })
    };
  }
}

// 📅 APPOINTMENTS HANDLERS
async function handleGetAppointments(MONGODB_URI, headers) {
  if (!MONGODB_URI) {
    return mockAppointments(headers);
  }

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const appointments = await client.db().collection('appointments').find().sort({ date: 1 }).toArray();
    await client.close();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        count: appointments.length, 
        data: appointments 
      })
    };
  } catch (error) {
    return mockAppointments(headers, error.message);
  }
}

async function handleCreateAppointment(MONGODB_URI, body, headers) {
  if (!MONGODB_URI) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: 'MongoDB not configured'
      })
    };
  }

  try {
    const appointmentData = JSON.parse(body);
    const appointment = {
      ...appointmentData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const result = await client.db().collection('appointments').insertOne(appointment);
    await client.close();
    
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'Appointment created successfully',
        data: { ...appointment, _id: result.insertedId }
      })
    };
  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: error.message 
      })
    };
  }
}

// 🏥 MEDICAL STATS
async function handleGetMedicalStats(MONGODB_URI, headers) {
  if (!MONGODB_URI) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          totalPatients: 2,
          totalAppointments: 1,
          pendingAppointments: 1,
          completedAppointments: 0
        }
      })
    };
  }

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const [patientCount, appointmentCount, pendingAppointments, completedAppointments] = await Promise.all([
      client.db().collection('patients').countDocuments(),
      client.db().collection('appointments').countDocuments(),
      client.db().collection('appointments').countDocuments({ status: 'Scheduled' }),
      client.db().collection('appointments').countDocuments({ status: 'Completed' })
    ]);

    await client.close();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          totalPatients: patientCount,
          totalAppointments: appointmentCount,
          pendingAppointments: pendingAppointments,
          completedAppointments: completedAppointments
        }
      })
    };
  } catch (error) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          totalPatients: 0,
          totalAppointments: 0,
          pendingAppointments: 0,
          completedAppointments: 0
        },
        error: error.message
      })
    };
  }
}

// 🌱 SEED DATABASE
async function handleSeedDatabase(MONGODB_URI, headers) {
  if (!MONGODB_URI) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: 'MongoDB not configured'
      })
    };
  }

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db();

    // احذفي البيانات القديمة
    await db.collection('patients').deleteMany({});
    await db.collection('appointments').deleteMany({});

    // أنشئي بيانات تجريبية
    const patients = await db.collection('patients').insertMany([
      {
        name: 'John Smith',
        age: 45,
        gender: 'male',
        phone: '+1234567890',
        email: 'john.smith@email.com',
        bloodType: 'A+',
        allergies: ['Penicillin', 'Shellfish'],
        condition: 'Stable',
        lastVisit: new Date('2024-01-10'),
        emergencyContact: {
          name: 'Jane Smith',
          phone: '+1234567891',
          relationship: 'Wife'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Maria Garcia',
        age: 32,
        gender: 'female', 
        phone: '+1234567892',
        email: 'maria.garcia@email.com',
        bloodType: 'O-',
        allergies: [],
        condition: 'Good',
        lastVisit: new Date('2024-01-12'),
        emergencyContact: {
          name: 'Carlos Garcia', 
          phone: '+1234567893',
          relationship: 'Husband'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    const appointments = await db.collection('appointments').insertMany([
      {
        patientId: patients.insertedIds[0].toString(),
        patientName: 'John Smith',
        doctorName: 'Dr. Ahmed Mohamed',
        date: new Date('2024-01-15T10:00:00'),
        status: 'Scheduled',
        type: 'Checkup',
        notes: 'Regular annual checkup',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        patientId: patients.insertedIds[1].toString(),
        patientName: 'Maria Garcia', 
        doctorName: 'Dr. Sarah Wilson',
        date: new Date('2024-01-15T14:30:00'),
        status: 'Completed',
        type: 'Follow-up',
        notes: 'Asthma treatment follow-up',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    await client.close();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Database seeded successfully! 🎉',
        patients: patients.insertedCount,
        appointments: appointments.insertedCount,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: error.message,
        message: 'Seed failed - check server logs'
      })
    };
  }
}

// 🎭 MOCK DATA FUNCTIONS
function mockPatients(headers, error = null) {
  const mockData = [
    { 
      _id: '1', 
      name: 'John Smith', 
      age: 45, 
      gender: 'male', 
      phone: '+1234567890',
      email: 'john@email.com',
      condition: 'Stable',
      createdAt: new Date()
    },
    { 
      _id: '2', 
      name: 'Maria Garcia', 
      age: 32, 
      gender: 'female', 
      phone: '+1234567891',
      email: 'maria@email.com',
      condition: 'Good',
      createdAt: new Date()
    }
  ];

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ 
      success: true, 
      count: mockData.length, 
      data: mockData,
      ...(error && { message: `Using mock data - ${error}` })
    })
  };
}

function mockAppointments(headers, error = null) {
  const mockData = [
    {
      _id: '1',
      patientId: '1',
      patientName: 'John Smith',
      doctorName: 'Dr. Ahmed',
      date: new Date('2024-01-15T10:00:00'),
      status: 'Scheduled',
      type: 'Checkup',
      createdAt: new Date()
    }
  ];

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ 
      success: true, 
      count: mockData.length, 
      data: mockData,
      ...(error && { message: `Using mock data - ${error}` })
    })
  };
}