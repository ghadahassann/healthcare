const { MongoClient } = require('mongodb');

exports.handler = async (event) => {
  const headers = {
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
    const db = client.db(); // سيستخدم database اللي في الـ URI

    console.log('🔗 Connected to MongoDB - Path:', path);

    // 🔍 HEALTH CHECK
    if (path === '/health' || path === '') {
      const dbStatus = 'Connected';
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true,
          status: 'OK', 
          database: dbStatus,
          timestamp: new Date().toISOString(),
          endpoints: [
            'GET /api/health',
            'GET /api/patients', 
            'POST /api/patients',
            'GET /api/appointments',
            'POST /api/appointments',
            'POST /api/seed'
          ]
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

    // 👥 PATIENTS - GET BY ID
    if (path.startsWith('/patients/') && event.httpMethod === 'GET') {
      const { ObjectId } = require('mongodb');
      const id = path.split('/')[2];
      
      try {
        const patient = await db.collection('patients').findOne({ _id: new ObjectId(id) });
        if (!patient) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ success: false, message: 'Patient not found' })
          };
        }
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, data: patient })
        };
      } catch (error) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'Invalid patient ID' })
        };
      }
    }

    // 👥 PATIENTS - DELETE
    if (path.startsWith('/patients/') && event.httpMethod === 'DELETE') {
      const { ObjectId } = require('mongodb');
      const id = path.split('/')[2];
      
      try {
        const result = await db.collection('patients').deleteOne({ _id: new ObjectId(id) });
        await db.collection('appointments').deleteMany({ patientId: id });
        
        if (result.deletedCount === 0) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ success: false, message: 'Patient not found' })
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
          body: JSON.stringify({ success: false, error: 'Invalid patient ID' })
        };
      }
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
          },
          {
            name: 'Ahmed Hassan',
            age: 28,
            gender: 'male',
            phone: '+1234567894', 
            email: 'ahmed.hassan@email.com',
            bloodType: 'B+',
            allergies: ['Ibuprofen'],
            condition: 'Critical',
            lastVisit: new Date('2024-01-14'),
            emergencyContact: {
              name: 'Fatima Hassan',
              phone: '+1234567895', 
              relationship: 'Sister'
            },
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]);

        // أنشئي مواعيد تجريبية
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
          },
          {
            patientId: patients.insertedIds[2],
            patientName: 'Ahmed Hassan',
            doctorName: 'Dr. Michael Brown',
            date: new Date('2024-01-16T09:15:00'),
            status: 'Urgent', 
            type: 'Consultation',
            notes: 'Critical condition monitoring',
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
          'GET    /api/patients/:id',
          'DELETE /api/patients/:id',
          'GET    /api/appointments',
          'POST   /api/appointments',
          'GET    /api/medical',
          'POST   /api/seed'
        ]
      })
    };

  } catch (error) {
    console.error('❌ MongoDB Error:', error);
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