import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientsAPI, appointmentsAPI, seedAPI } from '../utils/api';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeAction, setActiveAction] = useState(null);
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    pendingRecords: 0,
    urgentCases: 0
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [patientsResponse, appointmentsResponse] = await Promise.all([
        patientsAPI.getAll(),
        appointmentsAPI.getAll()
      ]);

      const patients = patientsResponse.data || [];
      const appointments = appointmentsResponse.data || [];

      const today = new Date().toDateString();
      const todayApps = appointments.filter(apt => 
        new Date(apt.date).toDateString() === today
      );

      setStats({
        totalPatients: patients.length,
        todayAppointments: todayApps.length,
        pendingRecords: appointments.filter(apt => apt.status === 'Scheduled').length,
        urgentCases: appointments.filter(apt => apt.status === 'Urgent').length
      });

      setRecentAppointments(appointments.slice(0, 3));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsData = [
    { 
      icon: 'fas fa-users', 
      label: 'Total Patients', 
      value: stats.totalPatients, 
      color: 'primary',
      onClick: () => navigate('/patients')
    },
    { 
      icon: 'fas fa-calendar-check', 
      label: "Today's Appointments", 
      value: stats.todayAppointments, 
      color: 'success',
      onClick: () => navigate('/appointments')
    },
    { 
      icon: 'fas fa-file-medical', 
      label: 'Pending Records', 
      value: stats.pendingRecords, 
      color: 'warning',
      onClick: () => navigate('/medical-records')
    },
    { 
      icon: 'fas fa-bell', 
      label: 'Urgent Cases', 
      value: stats.urgentCases, 
      color: 'danger',
      onClick: () => console.log('View urgent cases')
    }
  ];

  const quickActions = [
    { 
      icon: 'fas fa-user-plus', 
      label: 'Add Patient', 
      color: 'primary',
      onClick: () => navigate('/patients')
    },
    { 
      icon: 'fas fa-calendar-plus', 
      label: 'New Appointment', 
      color: 'success',
      onClick: () => navigate('/appointments')
    },
    { 
      icon: 'fas fa-database', 
      label: 'Seed Data', 
      color: 'info',
      onClick: async () => {
        try {
          setActiveAction('Seeding database...');
          await seedAPI.seedData();
          fetchDashboardData();
        } catch (error) {
          alert('Failed to seed data');
        } finally {
          setActiveAction(null);
        }
      }
    },
    { 
      icon: 'fas fa-sync', 
      label: 'Refresh', 
      color: 'warning',
      onClick: fetchDashboardData
    }
  ];

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {activeAction && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>{activeAction}</p>
        </div>
      )}

      <div className="dashboard-header">
        <div className="header-content">
          <h1>Medical Dashboard</h1>
          <p>Healthcare Management System</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => navigate('/appointments')}>
            <i className="fas fa-plus"></i>
            New Appointment
          </button>
        </div>
      </div>

      <div className="stats-grid">
        {statsData.map((stat, index) => (
          <div 
            key={index} 
            className={`stat-card stat-${stat.color} clickable`}
            onClick={stat.onClick}
          >
            <div className="stat-icon">
              <i className={stat.icon}></i>
            </div>
            <div className="stat-content">
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-content">
        <div className="content-row">
          <div className="content-col main-col">
            <div className="card recent-appointments">
              <div className="card-header">
                <h3>Recent Appointments</h3>
                <button className="btn btn-text" onClick={() => navigate('/appointments')}>
                  View All
                </button>
              </div>
              <div className="card-body">
                {recentAppointments.length === 0 ? (
                  <div className="empty-state">
                    <i className="fas fa-calendar-times"></i>
                    <p>No appointments found</p>
                  </div>
                ) : (
                  <div className="appointment-list">
                    {recentAppointments.map((appointment, index) => (
                      <div key={index} className="appointment-item">
                        <div className="appointment-info">
                          <div className="patient-avatar">
                            <i className="fas fa-user"></i>
                          </div>
                          <div className="appointment-details">
                            <h4>{appointment.patientName}</h4>
                            <p>{appointment.type} - {appointment.doctorName}</p>
                            <span className="appointment-time">
                              <i className="fas fa-clock"></i>
                              {new Date(appointment.date).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className={`appointment-status status-${appointment.status.toLowerCase()}`}>
                          {appointment.status}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="content-col side-col">
            <div className="card quick-actions-card">
              <div className="card-header">
                <h3>Quick Actions</h3>
              </div>
              <div className="card-body">
                <div className="actions-grid">
                  {quickActions.map((action, index) => (
                    <button 
                      key={index} 
                      className={`action-btn btn-${action.color}`}
                      onClick={action.onClick}
                    >
                      <i className={action.icon}></i>
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;