const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('../../src/server');

describe('Appointments Integration Tests', () => {
  let mongoServer;
  let patientId;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    await mongoose.connect(mongoUri);
  }, 30000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    await mongoose.connection.db.dropDatabase();

    const patientResponse = await request(app)
      .post('/api/patients')
      .send({
        name: 'Integration Test Patient',
        age: 35,
        gender: 'female',
        phone: '+1234567890',
        email: 'integration@test.com'
      });

    patientId = patientResponse.body.data._id;
  });

  describe('Patient-Appointment Flow', () => {
    it('should create appointment for existing patient', async () => {
      const appointmentData = {
        patientId: patientId,
        patientName: 'Integration Test Patient',
        doctorName: 'Dr. Test',
        date: new Date().toISOString(),
        type: 'Checkup',
        notes: 'Integration test appointment'
      };

      const response = await request(app)
        .post('/api/appointments')
        .send(appointmentData);
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.patientName).toBe('Integration Test Patient');
    });

    it('should delete patient and related appointments', async () => {
      // First create an appointment
      await request(app)
        .post('/api/appointments')
        .send({
          patientId: patientId,
          patientName: 'Integration Test Patient',
          doctorName: 'Dr. Test',
          date: new Date().toISOString(),
          type: 'Checkup'
        });

      // Then delete the patient
      const deleteResponse = await request(app)
        .delete(`/api/patients/${patientId}`);
      
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);

      // Verify appointments are also deleted
      const appointmentsResponse = await request(app).get('/api/appointments');
      expect(appointmentsResponse.body.data.length).toBe(0);
    });
  });
});