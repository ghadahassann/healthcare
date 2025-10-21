import React, { useState, useEffect } from 'react';
import { patientsAPI } from '../utils/api';
import './Patients.css';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [newPatient, setNewPatient] = useState({
    name: '',
    age: '',
    gender: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await patientsAPI.getAll();
      setPatients(response.data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      alert('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    try {
      await patientsAPI.create(newPatient);
      setNewPatient({ name: '', age: '', gender: '', phone: '', email: '' });
      setShowForm(false);
      fetchPatients();
      alert('Patient created successfully!');
    } catch (error) {
      alert('Failed to create patient: ' + error.message);
    }
  };

  const handleEditPatient = (patient) => {
    setEditingPatient(patient);
    setNewPatient({
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      phone: patient.phone,
      email: patient.email
    });
    setShowForm(true);
  };

  const handleUpdatePatient = async (e) => {
    e.preventDefault();
    try {
      await patientsAPI.update(editingPatient._id, newPatient);
      setEditingPatient(null);
      setNewPatient({ name: '', age: '', gender: '', phone: '', email: '' });
      setShowForm(false);
      fetchPatients();
      alert('Patient updated successfully!');
    } catch (error) {
      alert('Failed to update patient: ' + error.message);
    }
  };

  const handleDeletePatient = async (patientId) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      try {
        await patientsAPI.delete(patientId);
        fetchPatients();
        alert('Patient deleted successfully!');
      } catch (error) {
        alert('Failed to delete patient: ' + error.message);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingPatient(null);
    setNewPatient({ name: '', age: '', gender: '', phone: '', email: '' });
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="patients-page">
        <div className="loading-spinner"></div>
        <p>Loading patients...</p>
      </div>
    );
  }

  return (
    <div className="patients-page">
      <div className="page-header">
        <h2>Patients Management</h2>
        <p>Manage your patients records and information</p>
      </div>
      
      <div className="page-content">
        <div className="card">
          <div className="card-header">
            <h3>Patients List ({patients.length})</h3>
            <button 
              className="btn btn-primary" 
              onClick={() => {
                setEditingPatient(null);
                setNewPatient({ name: '', age: '', gender: '', phone: '', email: '' });
                setShowForm(!showForm);
              }}
            >
              <i className="fas fa-plus"></i>
              Add New Patient
            </button>
          </div>

          {showForm && (
            <div className="patient-form">
              <h4>{editingPatient ? 'Edit Patient' : 'Add New Patient'}</h4>
              <form onSubmit={editingPatient ? handleUpdatePatient : handleCreatePatient}>
                <div className="form-row">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={newPatient.name}
                    onChange={(e) => setNewPatient({...newPatient, name: e.target.value})}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Age"
                    value={newPatient.age}
                    onChange={(e) => setNewPatient({...newPatient, age: e.target.value})}
                    required
                  />
                </div>
                <div className="form-row">
                  <select
                    value={newPatient.gender}
                    onChange={(e) => setNewPatient({...newPatient, gender: e.target.value})}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={newPatient.phone}
                    onChange={(e) => setNewPatient({...newPatient, phone: e.target.value})}
                    required
                  />
                </div>
                <input
                  type="email"
                  placeholder="Email"
                  value={newPatient.email}
                  onChange={(e) => setNewPatient({...newPatient, email: e.target.value})}
                  required
                />
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    {editingPatient ? 'Update Patient' : 'Create Patient'}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="card-body">
            {patients.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-users-slash"></i>
                <p>No patients found</p>
                <button 
                  className="btn btn-primary" 
                  onClick={() => setShowForm(true)}
                >
                  Add First Patient
                </button>
              </div>
            ) : (
              <div className="patients-list">
                {patients.map(patient => (
                  <div key={patient._id} className="patient-card">
                    <div className="patient-info">
                      <h4>{patient.name}</h4>
                      <p>Age: {patient.age} | Gender: {patient.gender}</p>
                      <p>Phone: {patient.phone}</p>
                      <p>Email: {patient.email}</p>
                      {patient.condition && (
                        <span className={`patient-status status-${patient.condition.toLowerCase()}`}>
                          {patient.condition}
                        </span>
                      )}
                    </div>
                    <div className="patient-actions">
                      <button 
                        className="btn btn-text"
                        onClick={() => handleEditPatient(patient)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn btn-danger"
                        onClick={() => handleDeletePatient(patient._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Patients;