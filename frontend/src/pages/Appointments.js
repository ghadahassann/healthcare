import React, { useState, useEffect } from 'react';
import { appointmentsAPI, patientsAPI } from '../utils/api';
import './Appointments.css';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [newAppointment, setNewAppointment] = useState({
    patientId: '',
    doctorName: '',
    date: '',
    type: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appsRes, patientsRes] = await Promise.all([
        appointmentsAPI.getAll(),
        patientsAPI.getAll()
      ]);
      setAppointments(appsRes.data || []);
      setPatients(patientsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    try {
      const selectedPatient = patients.find(p => p._id === newAppointment.patientId);
      const appointmentData = {
        ...newAppointment,
        patientName: selectedPatient?.name || 'Unknown Patient'
      };
      
      await appointmentsAPI.create(appointmentData);
      resetForm();
      fetchData();
      alert('Appointment created successfully!');
    } catch (error) {
      alert('Failed to create appointment: ' + error.message);
    }
  };

  const handleEditAppointment = (appointment) => {
    setEditingAppointment(appointment);
    setNewAppointment({
      patientId: appointment.patientId,
      doctorName: appointment.doctorName,
      date: new Date(appointment.date).toISOString().slice(0, 16),
      type: appointment.type,
      notes: appointment.notes || ''
    });
    setShowForm(true);
  };

  const handleUpdateAppointment = async (e) => {
    e.preventDefault();
    try {
      const selectedPatient = patients.find(p => p._id === newAppointment.patientId);
      const appointmentData = {
        ...newAppointment,
        patientName: selectedPatient?.name || 'Unknown Patient'
      };
      
      await appointmentsAPI.update(editingAppointment._id, appointmentData);
      resetForm();
      fetchData();
      alert('Appointment updated successfully!');
    } catch (error) {
      alert('Failed to update appointment: ' + error.message);
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      try {
        await appointmentsAPI.delete(appointmentId);
        fetchData();
        alert('Appointment deleted successfully!');
      } catch (error) {
        alert('Failed to delete appointment: ' + error.message);
      }
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await appointmentsAPI.update(appointmentId, { status: 'Cancelled' });
        fetchData();
        alert('Appointment cancelled successfully!');
      } catch (error) {
        alert('Failed to cancel appointment: ' + error.message);
      }
    }
  };

  const resetForm = () => {
    setEditingAppointment(null);
    setNewAppointment({ patientId: '', doctorName: '', date: '', type: '', notes: '' });
    setShowForm(false);
  };

  const getStatusBadge = (status) => {
    const statusClass = {
      'Scheduled': 'status-scheduled',
      'Confirmed': 'status-confirmed',
      'Completed': 'status-completed',
      'Cancelled': 'status-cancelled',
      'Urgent': 'status-urgent'
    }[status] || 'status-scheduled';

    return <span className={`appointment-status ${statusClass}`}>{status}</span>;
  };

  if (loading) {
    return (
      <div className="appointments-page">
        <div className="loading-spinner"></div>
        <p>Loading appointments...</p>
      </div>
    );
  }

  return (
    <div className="appointments-page">
      <div className="page-header">
        <h2>Appointments Schedule</h2>
        <p>Manage and schedule patient appointments</p>
      </div>
      
      <div className="page-content">
        <div className="card">
          <div className="card-header">
            <h3>Appointments ({appointments.length})</h3>
            <button 
              className="btn btn-primary" 
              onClick={() => {
                resetForm();
                setShowForm(!showForm);
              }}
            >
              <i className="fas fa-calendar-plus"></i>
              Schedule New
            </button>
          </div>

          {showForm && (
            <div className="appointment-form">
              <h4>{editingAppointment ? 'Edit Appointment' : 'Schedule New Appointment'}</h4>
              <form onSubmit={editingAppointment ? handleUpdateAppointment : handleCreateAppointment}>
                <div className="form-row">
                  <select
                    value={newAppointment.patientId}
                    onChange={(e) => setNewAppointment({...newAppointment, patientId: e.target.value})}
                    required
                  >
                    <option value="">Select Patient</option>
                    {patients.map(patient => (
                      <option key={patient._id} value={patient._id}>
                        {patient.name} (Age: {patient.age})
                      </option>
                    ))}
                  </select>
                  
                  <input
                    type="text"
                    placeholder="Doctor Name"
                    value={newAppointment.doctorName}
                    onChange={(e) => setNewAppointment({...newAppointment, doctorName: e.target.value})}
                    required
                  />
                </div>

                <div className="form-row">
                  <input
                    type="datetime-local"
                    value={newAppointment.date}
                    onChange={(e) => setNewAppointment({...newAppointment, date: e.target.value})}
                    required
                  />
                  
                  <select
                    value={newAppointment.type}
                    onChange={(e) => setNewAppointment({...newAppointment, type: e.target.value})}
                    required
                  >
                    <option value="">Appointment Type</option>
                    <option value="Checkup">Checkup</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Consultation">Consultation</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>

                <textarea
                  placeholder="Notes (optional)"
                  value={newAppointment.notes}
                  onChange={(e) => setNewAppointment({...newAppointment, notes: e.target.value})}
                  rows="3"
                />

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    {editingAppointment ? 'Update Appointment' : 'Schedule Appointment'}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={resetForm}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="card-body">
            {appointments.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-calendar-times"></i>
                <p>No appointments scheduled</p>
                <button 
                  className="btn btn-primary" 
                  onClick={() => setShowForm(true)}
                >
                  Schedule First Appointment
                </button>
              </div>
            ) : (
              <div className="appointments-list">
                {appointments.map(appointment => (
                  <div key={appointment._id} className="appointment-card">
                    <div className="appointment-info">
                      <div className="appointment-header">
                        <h4>{appointment.patientName}</h4>
                        {getStatusBadge(appointment.status)}
                      </div>
                      <div className="appointment-details">
                        <p>
                          <i className="fas fa-user-md"></i>
                          {appointment.doctorName}
                        </p>
                        <p>
                          <i className="fas fa-stethoscope"></i>
                          {appointment.type}
                        </p>
                        <p>
                          <i className="fas fa-clock"></i>
                          {new Date(appointment.date).toLocaleString()}
                        </p>
                        {appointment.notes && (
                          <p className="appointment-notes">
                            <i className="fas fa-file-medical"></i>
                            {appointment.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="appointment-actions">
                      <button 
                        className="btn btn-text"
                        onClick={() => handleEditAppointment(appointment)}
                      >
                        Edit
                      </button>
                      {appointment.status !== 'Cancelled' && (
                        <button 
                          className="btn btn-warning"
                          onClick={() => handleCancelAppointment(appointment._id)}
                        >
                          Cancel
                        </button>
                      )}
                      <button 
                        className="btn btn-danger"
                        onClick={() => handleDeleteAppointment(appointment._id)}
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

export default Appointments;