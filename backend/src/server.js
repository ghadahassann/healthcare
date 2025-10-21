const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Production optimizations
let helmet, compression;
if (process.env.NODE_ENV === 'production') {
  helmet = require('helmet');
  compression = require('compression');
}

// MongoDB Models
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
}, { 
  timestamps: true 
});

const AppointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  patientName: { type: String, required: true },
  doctorName: { type: String, required: true },
  date: { type: Date, required: true },
  status: { type: String, default: 'Scheduled' },
  type: String,
  notes: String
}, { 
  timestamps: true 
});

const Patient = mongoose.model('Patient', PatientSchema);
const Appointment = mongoose.model('Appointment', AppointmentSchema);

// CORS configuration for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://healthcare-frontend.netlify.app',
        'https://your-app-name.netlify.app'
      ] 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Production security middleware
if (process.env.NODE_ENV === 'production') {
  app.use(helmet());
  app.use(compression());
  console.log('🔒 Production security enabled');
}

// ... كل الـ routes تبقى كما هي ...

// MongoDB connection settings
const mongooseOptions = {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
};

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare';
    
    if (!mongoURI) {
      console.error('❌ MONGODB_URI is required');
      process.exit(1);
    }

    console.log(`🔗 Connecting to MongoDB...`);
    
    await mongoose.connect(mongoURI, mongooseOptions);
    
    console.log('✅ Connected to MongoDB successfully!');
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`📊 Health: http://localhost:${PORT}/api/health`);
      
      if (process.env.NODE_ENV === 'production') {
        console.log(`🔒 Production mode: Security features enabled`);
      }
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down gracefully...');
  await mongoose.connection.close();
  console.log('✅ MongoDB connection closed');
  process.exit(0);
});

startServer();