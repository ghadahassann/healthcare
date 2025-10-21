const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../../src/server');

describe('Appointments Integration Tests', () => {
  let patientId;

  beforeAll(async () => {
    const TEST_DB_URI = 'mongodb://127.0.0.1:27017/healthcare-test';
    
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    await mongoose.connect(TEST_DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await mongoose.connection.collection('patients').deleteMany({});
    await mongoose.connection.collection('appointments').deleteMany({});

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
      await request(app)
        .post('/api/appointments')
        .send({
          patientId: patientId,
          patientName: 'Integration Test Patient',
          doctorName: 'Dr. Test',
          date: new Date().toISOString(),
          type: 'Checkup'
        });

      const deleteResponse = await request(app)
        .delete(`/api/patients/${patientId}`);
      
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);

      const appointmentsResponse = await request(app).get('/api/appointments');
      expect(appointmentsResponse.body.data.length).toBe(0);
    });
  });
});