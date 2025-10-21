// src/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3004;

/* -------------------- CORS -------------------- */
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

/* -------------------- Request logging -------------------- */
app.use((req, _res, next) => {
  console.log(`📨 ${req.method} ${req.path}`, Object.keys(req.body || {}).length ? req.body : '');
  next();
});

/* -------------------- Mongo Models -------------------- */
const PatientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  bloodType: String,
  allergies: [String],
  condition: String,
  lastVisit: Date,
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  }
}, { timestamps: true });

const AppointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  patientName: { type: String, required: true },
  doctorName: { type: String, required: true },
  date: { type: Date, required: true },
  status: { type: String, default: 'Scheduled' },
  type: String,
  notes: String
}, { timestamps: true });

const Patient = mongoose.model('Patient', PatientSchema);
const Appointment = mongoose.model('Appointment', AppointmentSchema);

/* -------------------- Basic Routes -------------------- */
app.get('/', (_req, res) => {
  res.json({
    message: 'Healthcare Backend API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (_req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  res.json({
    status: 'OK',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    endpoints: ['/api/patients', '/api/appointments', '/api/medical', '/api/seed']
  });
});

/* -------------------- PATIENTS -------------------- */
app.get('/api/patients', async (_req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });
    res.json({ success: true, count: patients.length, data: patients });
  } catch (error) {
    console.error('❌ Get patients error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/patients/:id', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
    res.json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/patients', async (req, res) => {
  try {
    const patient = new Patient({ ...req.body, lastVisit: req.body.lastVisit || new Date() });
    await patient.save();
    res.status(201).json({ success: true, message: 'Patient created successfully', data: patient });
  } catch (error) {
    console.error('❌ Create patient error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

app.put('/api/patients/:id', async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
    res.json({ success: true, message: 'Patient updated successfully', data: patient });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.delete('/api/patients/:id', async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
    await Appointment.deleteMany({ patientId: req.params.id });
    res.json({ success: true, message: 'Patient deleted successfully', data: patient });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/* -------------------- APPOINTMENTS -------------------- */
app.get('/api/appointments', async (_req, res) => {
  try {
    const appointments = await Appointment.find().populate('patientId').sort({ date: 1 });
    res.json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    console.error('❌ Get appointments error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/appointments', async (req, res) => {
  try {
    const appointment = new Appointment(req.body);
    await appointment.save();
    await appointment.populate('patientId');
    res.status(201).json({ success: true, message: 'Appointment created successfully', data: appointment });
  } catch (error) {
    console.error('❌ Create appointment error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

app.put('/api/appointments/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    res.json({ success: true, message: 'Appointment updated successfully', data: appointment });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.delete('/api/appointments/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    res.json({ success: true, message: 'Appointment deleted successfully', data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/* -------------------- MEDICAL STATS -------------------- */
app.get('/api/medical', async (_req, res) => {
  try {
    const [patientCount, appointmentCount, pendingAppointments, completedAppointments, urgentCases] = await Promise.all([
      Patient.countDocuments(),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: 'Scheduled' }),
      Appointment.countDocuments({ status: 'Completed' }),
      Appointment.countDocuments({ status: 'Urgent' })
    ]);

    res.json({
      success: true,
      data: { totalPatients: patientCount, totalAppointments: appointmentCount, pendingAppointments, completedAppointments, urgentCases }
    });
  } catch (error) {
    console.error('❌ Medical stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/* -------------------- SEED -------------------- */
app.post('/api/seed', async (_req, res) => {
  try {
    await Patient.deleteMany({});
    await Appointment.deleteMany({});

    const patients = await Patient.create([
      {
        name: 'John Smith',
        age: 45, gender: 'male', phone: '+1234567890', email: 'john.smith@email.com',
        bloodType: 'A+', allergies: ['Penicillin', 'Shellfish'], condition: 'Stable',
        lastVisit: new Date('2024-01-10'),
        emergencyContact: { name: 'Jane Smith', phone: '+1234567891', relationship: 'Wife' }
      },
      {
        name: 'Maria Garcia',
        age: 32, gender: 'female', phone: '+1234567892', email: 'maria.garcia@email.com',
        bloodType: 'O-', allergies: ['None'], condition: 'Good',
        lastVisit: new Date('2024-01-12'),
        emergencyContact: { name: 'Carlos Garcia', phone: '+1234567893', relationship: 'Husband' }
      },
      {
        name: 'Ahmed Hassan',
        age: 28, gender: 'male', phone: '+1234567894', email: 'ahmed.hassan@email.com',
        bloodType: 'B+', allergies: ['Ibuprofen'], condition: 'Critical',
        lastVisit: new Date('2024-01-14'),
        emergencyContact: { name: 'Fatima Hassan', phone: '+1234567895', relationship: 'Sister' }
      }
    ]);

    const appointments = await Appointment.create([
      {
        patientId: patients[0]._id,
        patientName: 'John Smith',
        doctorName: 'Dr. Ahmed Mohamed',
        date: new Date('2024-01-15T10:00:00'),
        status: 'Scheduled',
        type: 'Checkup',
        notes: 'Regular annual checkup'
      },
      {
        patientId: patients[1]._id,
        patientName: 'Maria Garcia',
        doctorName: 'Dr. Sarah Wilson',
        date: new Date('2024-01-15T14:30:00'),
        status: 'Completed',
        type: 'Follow-up',
        notes: 'Asthma treatment follow-up'
      },
      {
        patientId: patients[2]._id,
        patientName: 'Ahmed Hassan',
        doctorName: 'Dr. Michael Brown',
        date: new Date('2024-01-16T09:15:00'),
        status: 'Urgent',
        type: 'Consultation',
        notes: 'Critical condition monitoring'
      }
    ]);

    res.json({
      success: true,
      message: 'Database seeded successfully! 🎉',
      patients: patients.length,
      appointments: appointments.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Seed error:', error);
    res.status(500).json({ success: false, error: error.message, message: 'Seed failed - check server logs' });
  }
});

// (اختياري) GET seed للتجربة السريعة
app.get('/api/seed', async (_req, res) => {
  try {
    await Patient.deleteMany({});
    await Appointment.deleteMany({});
    const patients = await Patient.create([
      { name: 'John Smith', age: 45, gender: 'male', phone: '+1234567890', email: 'john.smith@email.com', condition: 'Stable', lastVisit: new Date('2024-01-10') },
      { name: 'Maria Garcia', age: 32, gender: 'female', phone: '+1234567892', email: 'maria.garcia@email.com', condition: 'Good', lastVisit: new Date('2024-01-12') }
    ]);
    await Appointment.create([
      { patientId: patients[0]._id, patientName: 'John Smith', doctorName: 'Dr. Ahmed Mohamed', date: new Date('2024-01-15T10:00:00'), status: 'Scheduled', type: 'Checkup' },
      { patientId: patients[1]._id, patientName: 'Maria Garcia', doctorName: 'Dr. Sarah Wilson', date: new Date('2024-01-15T14:30:00'), status: 'Completed', type: 'Follow-up' }
    ]);
    res.json({ success: true, message: 'Database seeded successfully via GET! 🎉', patients: patients.length, appointments: 2 });
  } catch (error) {
    console.error('❌ GET Seed error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/* -------------------- 404 & Error -------------------- */
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
    availableEndpoints: [
      'GET    /',
      'GET    /api/health',
      'GET    /api/patients',
      'POST   /api/patients',
      'GET    /api/patients/:id',
      'PUT    /api/patients/:id',
      'DELETE /api/patients/:id',
      'GET    /api/appointments',
      'POST   /api/appointments',
      'PUT    /api/appointments/:id',
      'DELETE /api/appointments/:id',
      'GET    /api/medical',
      'POST   /api/seed',
      'GET    /api/seed'
    ]
  });
});

app.use((err, _req, res, _next) => {
  console.error('❌ Server error:', err.stack);
  res.status(500).json({ success: false, error: 'Internal server error', message: err.message });
});

/* -------------------- Mongo Connect (with retry) -------------------- */
const mongoURI = process.env.NODE_ENV === 'test' 
  ? 'mongodb://127.0.0.1:27017/healthcare-test'
  : 'mongodb://127.0.0.1:27017/healthcare';

async function connectWithRetry(maxRetries = 10, delayMs = 2000) {
  let attempt = 0;
  while (true) {
    try {
      attempt++;
      console.log(`🔗 Connecting to MongoDB (attempt ${attempt}): ${mongoURI}`);
      await mongoose.connect(mongoURI);
      console.log('✅ Connected to MongoDB successfully!');
      break;
    } catch (err) {
      console.error(`❌ MongoDB connection failed (attempt ${attempt}): ${err.message}`);
      if (attempt >= maxRetries) {
        console.error('💥 Exceeded max retries. Exiting.');
        process.exit(1);
      }
      const wait = delayMs * Math.min(attempt, 5);
      console.log(`⏳ Retrying in ${wait} ms...`);
      await new Promise(r => setTimeout(r, wait));
    }
  }
}

mongoose.connection.on('connected', () => console.log('🟢 Mongoose connected'));
mongoose.connection.on('disconnected', () => console.log('🟡 Mongoose disconnected'));
mongoose.connection.on('error', (e) => console.error('🔴 Mongoose error:', e.message));

process.on('SIGTERM', async () => {
  console.log('👋 SIGTERM received. Closing server & Mongo connection...');
  await mongoose.connection.close();
  process.exit(0);
});

// Export the app without starting the server
module.exports = { app, connectWithRetry, Patient, Appointment };

// Start server only if this file is run directly, not when imported
if (require.main === module) {
  (async function start() {
    await connectWithRetry();
    app.listen(PORT, () => {
      console.log(`🚀 Healthcare Backend Server running on port ${PORT}`);
      console.log(`📊 Health:      http://localhost:${PORT}/api/health`);
      console.log(`👥 Patients:    http://localhost:${PORT}/api/patients`);
      console.log(`📅 Appointments:http://localhost:${PORT}/api/appointments`);
      console.log(`🏥 Medical:     http://localhost:${PORT}/api/medical`);
      console.log(`🌱 Seed:        http://localhost:${PORT}/api/seed`);
      console.log(`⏰ Started at:  ${new Date().toLocaleString()}`);
    });
  })();
}