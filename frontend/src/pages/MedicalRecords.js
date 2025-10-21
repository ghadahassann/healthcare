import React, { useState, useEffect } from 'react';
import { patientsAPI } from '../utils/api';
import './MedicalRecords.css';

const MedicalRecords = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updatedPatient, setUpdatedPatient] = useState({});

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
      alert('Failed to load medical records');
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setUpdatedPatient({
      condition: patient.condition || '',
      bloodType: patient.bloodType || '',
      allergies: patient.allergies || []
    });
    setShowUpdateForm(false);
  };

  const handleUpdateRecord = async (e) => {
    e.preventDefault();
    try {
      await patientsAPI.update(selectedPatient._id, updatedPatient);
      setShowUpdateForm(false);
      fetchPatients();
      // Update the selected patient data
      setSelectedPatient(prev => ({ ...prev, ...updatedPatient }));
      alert('Medical record updated successfully!');
    } catch (error) {
      alert('Failed to update record: ' + error.message);
    }
  };

  const handleAddAllergy = () => {
    setUpdatedPatient(prev => ({
      ...prev,
      allergies: [...(prev.allergies || []), '']
    }));
  };

  const handleAllergyChange = (index, value) => {
    const newAllergies = [...(updatedPatient.allergies || [])];
    newAllergies[index] = value;
    setUpdatedPatient(prev => ({
      ...prev,
      allergies: newAllergies
    }));
  };

  const handleRemoveAllergy = (index) => {
    const newAllergies = updatedPatient.allergies.filter((_, i) => i !== index);
    setUpdatedPatient(prev => ({
      ...prev,
      allergies: newAllergies
    }));
  };

  const getConditionBadge = (condition) => {
    const conditionClass = {
      'Stable': 'condition-stable',
      'Good': 'condition-good',
      'Critical': 'condition-critical',
      'Improving': 'condition-improving'
    }[condition] || 'condition-stable';

    return <span className={`condition-badge ${conditionClass}`}>{condition}</span>;
  };

  if (loading) {
    return (
      <div className="medical-records-page">
        <div className="loading-spinner"></div>
        <p>Loading medical records...</p>
      </div>
    );
  }

  return (
    <div className="medical-records-page">
      <div className="page-header">
        <h2>Medical Records</h2>
        <p>Access and manage patient medical records</p>
      </div>
      
      <div className="page-content">
        <div className="medical-layout">
          <div className="patients-sidebar">
            <div className="card">
              <div className="card-header">
                <h3>Patients ({patients.length})</h3>
              </div>
              <div className="card-body">
                {patients.length === 0 ? (
                  <div className="empty-state">
                    <i className="fas fa-users-slash"></i>
                    <p>No patients found</p>
                  </div>
                ) : (
                  <div className="patients-list">
                    {patients.map(patient => (
                      <div 
                        key={patient._id}
                        className={`patient-item ${selectedPatient?._id === patient._id ? 'active' : ''}`}
                        onClick={() => handlePatientSelect(patient)}
                      >
                        <div className="patient-avatar">
                          <i className="fas fa-user"></i>
                        </div>
                        <div className="patient-details">
                          <h4>{patient.name}</h4>
                          <p>Age: {patient.age} | {patient.gender}</p>
                          {patient.condition && getConditionBadge(patient.condition)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="medical-details">
            {selectedPatient ? (
              <div className="card">
                <div className="card-header">
                  <h3>Medical Record - {selectedPatient.name}</h3>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setShowUpdateForm(!showUpdateForm)}
                  >
                    <i className="fas fa-edit"></i>
                    {showUpdateForm ? 'Cancel Update' : 'Update Record'}
                  </button>
                </div>
                <div className="card-body">
                  {showUpdateForm ? (
                    <div className="update-form">
                      <h4>Update Medical Information</h4>
                      <form onSubmit={handleUpdateRecord}>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Condition</label>
                            <select
                              value={updatedPatient.condition || ''}
                              onChange={(e) => setUpdatedPatient({...updatedPatient, condition: e.target.value})}
                            >
                              <option value="">Select Condition</option>
                              <option value="Stable">Stable</option>
                              <option value="Good">Good</option>
                              <option value="Critical">Critical</option>
                              <option value="Improving">Improving</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Blood Type</label>
                            <select
                              value={updatedPatient.bloodType || ''}
                              onChange={(e) => setUpdatedPatient({...updatedPatient, bloodType: e.target.value})}
                            >
                              <option value="">Select Blood Type</option>
                              <option value="A+">A+</option>
                              <option value="A-">A-</option>
                              <option value="B+">B+</option>
                              <option value="B-">B-</option>
                              <option value="O+">O+</option>
                              <option value="O-">O-</option>
                              <option value="AB+">AB+</option>
                              <option value="AB-">AB-</option>
                            </select>
                          </div>
                        </div>
                        
                        <div className="form-group">
                          <label>Allergies</label>
                          <div className="allergies-input">
                            {updatedPatient.allergies?.map((allergy, index) => (
                              <div key={index} className="allergy-input-row">
                                <input
                                  type="text"
                                  placeholder="Allergy"
                                  value={allergy}
                                  onChange={(e) => handleAllergyChange(index, e.target.value)}
                                />
                                <button 
                                  type="button"
                                  className="btn btn-danger btn-small"
                                  onClick={() => handleRemoveAllergy(index)}
                                >
                                  <i className="fas fa-times"></i>
                                </button>
                              </div>
                            ))}
                            <button 
                              type="button"
                              className="btn btn-text"
                              onClick={handleAddAllergy}
                            >
                              <i className="fas fa-plus"></i> Add Allergy
                            </button>
                          </div>
                        </div>

                        <div className="form-actions">
                          <button type="submit" className="btn btn-primary">
                            Update Record
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-secondary"
                            onClick={() => setShowUpdateForm(false)}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="medical-sections">
                      {/* Existing medical sections code remains the same */}
                      <section className="medical-section">
                        <h4>
                          <i className="fas fa-user"></i>
                          Personal Information
                        </h4>
                        <div className="info-grid">
                          <div className="info-item">
                            <label>Full Name</label>
                            <span>{selectedPatient.name}</span>
                          </div>
                          <div className="info-item">
                            <label>Age</label>
                            <span>{selectedPatient.age} years</span>
                          </div>
                          <div className="info-item">
                            <label>Gender</label>
                            <span>{selectedPatient.gender}</span>
                          </div>
                          <div className="info-item">
                            <label>Phone</label>
                            <span>{selectedPatient.phone}</span>
                          </div>
                          <div className="info-item">
                            <label>Email</label>
                            <span>{selectedPatient.email}</span>
                          </div>
                          <div className="info-item">
                            <label>Blood Type</label>
                            <span>{selectedPatient.bloodType || 'Not specified'}</span>
                          </div>
                        </div>
                      </section>

                      <section className="medical-section">
                        <h4>
                          <i className="fas fa-file-medical"></i>
                          Medical Information
                        </h4>
                        <div className="info-grid">
                          <div className="info-item">
                            <label>Current Condition</label>
                            {selectedPatient.condition && getConditionBadge(selectedPatient.condition)}
                          </div>
                          <div className="info-item">
                            <label>Last Visit</label>
                            <span>
                              {selectedPatient.lastVisit 
                                ? new Date(selectedPatient.lastVisit).toLocaleDateString()
                                : 'No visits recorded'
                              }
                            </span>
                          </div>
                          <div className="info-item full-width">
                            <label>Allergies</label>
                            <div className="allergies-list">
                              {selectedPatient.allergies && selectedPatient.allergies.length > 0 ? (
                                selectedPatient.allergies.map((allergy, index) => (
                                  <span key={index} className="allergy-tag">
                                    {allergy}
                                  </span>
                                ))
                              ) : (
                                <span className="no-data">No known allergies</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </section>

                      {selectedPatient.emergencyContact && (
                        <section className="medical-section">
                          <h4>
                            <i className="fas fa-phone"></i>
                            Emergency Contact
                          </h4>
                          <div className="info-grid">
                            <div className="info-item">
                              <label>Name</label>
                              <span>{selectedPatient.emergencyContact.name}</span>
                            </div>
                            <div className="info-item">
                              <label>Phone</label>
                              <span>{selectedPatient.emergencyContact.phone}</span>
                            </div>
                            <div className="info-item">
                              <label>Relationship</label>
                              <span>{selectedPatient.emergencyContact.relationship}</span>
                            </div>
                          </div>
                        </section>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card empty-selection">
                <div className="card-body">
                  <div className="empty-state">
                    <i className="fas fa-user-md"></i>
                    <h4>Select a Patient</h4>
                    <p>Choose a patient from the list to view their medical records</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalRecords;