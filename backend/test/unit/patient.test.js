const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('../../src/server');

describe('Patient API Unit Tests', () => {
  let mongoServer;

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
  });

  describe('GET /api/patients', () => {
    it('should return empty array when no patients', async () => {
      const response = await request(app).get('/api/patients');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should return all patients', async () => {
      await request(app)
        .post('/api/patients')
        .send({
          name: 'Test Patient',
          age: 30,
          gender: 'male',
          phone: '+1234567890',
          email: 'test@email.com'
        });

      const response = await request(app).get('/api/patients');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].name).toBe('Test Patient');
    });
  });

  describe('POST /api/patients', () => {
    it('should create a new patient', async () => {
      const patientData = {
        name: 'John Doe',
        age: 25,
        gender: 'male',
        phone: '+1234567890',
        email: 'john@email.com'
      };

      const response = await request(app)
        .post('/api/patients')
        .send(patientData);
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('John Doe');
      expect(response.body.data.age).toBe(25);
    });

    it('should return error for invalid data', async () => {
      const invalidData = {
        name: 'Test',
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/patients')
        .send(invalidData);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});