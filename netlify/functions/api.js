const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const serverless = require('serverless-http');

const app = express();

// CORS - اسمح بكل الـ origins
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare';

// Mongo Models
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

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.get('/api/health', async (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Healthcare API is running!',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/patients', async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });
    res.json({ success: true, count: patients.length, data: patients });
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
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.find().populate('patientId').sort({ date: 1 });
    res.json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
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
    res.status(400).json({ success: false, error: error.message });
  }
});

// Seed endpoint
app.post('/api/seed', async (req, res) => {
  try {
    await Patient.deleteMany({});
    await Appointment.deleteMany({});

    const patients = await Patient.create([
      {
        name: 'John Smith', age: 45, gender: 'male', phone: '+1234567890', email: 'john@email.com',
        bloodType: 'A+', allergies: ['Penicillin'], condition: 'Stable', lastVisit: new Date()
      },
      {
        name: 'Maria Garcia', age: 32, gender: 'female', phone: '+1234567891', email: 'maria@email.com',
        bloodType: 'O-', allergies: [], condition: 'Good', lastVisit: new Date()
      }
    ]);

    await Appointment.create([
      {
        patientId: patients[0]._id, patientName: 'John Smith', doctorName: 'Dr. Ahmed',
        date: new Date(), type: 'Checkup', status: 'Scheduled'
      },
      {
        patientId: patients[1]._id, patientName: 'Maria Garcia', doctorName: 'Dr. Sarah',
        date: new Date(), type: 'Follow-up', status: 'Completed'
      }
    ]);

    res.json({ success: true, message: 'Database seeded!', patients: 2, appointments: 2 });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports.handler = serverless(app);