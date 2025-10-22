const { MongoClient } = require('mongodb');

exports.handler = async (event) => {
  // Headers ثابتة لكل الـ responses
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const path = event.path.replace('/.netlify/functions/api', '');
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'MongoDB URI not configured in environment variables' 
      })
    };
  }

  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();

    // 🔍 HEALTH CHECK
    if (path === '/health' || path === '') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true,
          status: 'OK', 
          database: 'Connected',
          timestamp: new Date().toISOString()
        })
      };
    }

    // 👥 PATIENTS - GET ALL
    if (path === '/patients' && event.httpMethod === 'GET') {
      const patients = await db.collection('patients').find().sort({ createdAt: -1 }).toArray();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          count: patients.length, 
          data: patients 
        })
      };
    }

    // 👥 PATIENTS - CREATE
    if (path === '/patients' && event.httpMethod === 'POST') {
      const patientData = JSON.parse(event.body);
      const patient = {
        ...patientData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await db.collection('patients').insertOne(patient);
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ 
          success: true, 
          message: 'Patient created successfully',
          data: { ...patient, _id: result.insertedId }
        })
      };
    }

    // 📅 APPOINTMENTS - GET ALL
    if (path === '/appointments' && event.httpMethod === 'GET') {
      const appointments = await db.collection('appointments').find().sort({ date: 1 }).toArray();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          count: appointments.length, 
          data: appointments 
        })
      };
    }

    // 📅 APPOINTMENTS - CREATE
    if (path === '/appointments' && event.httpMethod === 'POST') {
      const appointmentData = JSON.parse(event.body);
      const appointment = {
        ...appointmentData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await db.collection('appointments').insertOne(appointment);
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ 
          success: true, 
          message: 'Appointment created successfully',
          data: { ...appointment, _id: result.insertedId }
        })
      };
    }

    // 🏥 MEDICAL STATS
    if (path === '/medical' && event.httpMethod === 'GET') {
      const [patientCount, appointmentCount, pendingAppointments, completedAppointments] = await Promise.all([
        db.collection('patients').countDocuments(),
        db.collection('appointments').countDocuments(),
        db.collection('appointments').countDocuments({ status: 'Scheduled' }),
        db.collection('appointments').countDocuments({ status: 'Completed' })
      ]);

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
    }

    // 🌱 SEED DATABASE
    if (path === '/seed' && event.httpMethod === 'POST') {
      try {
        await db.collection('patients').deleteMany({});
        await db.collection('appointments').deleteMany({});

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
            patientId: patients.insertedIds[0],
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
            patientId: patients.insertedIds[1],
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

    // ❌ ENDPOINT NOT FOUND
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: 'Endpoint not found',
        path: path,
        availableEndpoints: [
          'GET    /api/health',
          'GET    /api/patients',
          'POST   /api/patients', 
          'GET    /api/appointments',
          'POST   /api/appointments',
          'GET    /api/medical',
          'POST   /api/seed'
        ]
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: 'Database error: ' + error.message 
      })
    };
  } finally {
    await client.close();
  }
};