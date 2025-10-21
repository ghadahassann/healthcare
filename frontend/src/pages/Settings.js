import React, { useState } from 'react';
import './Settings.css';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    hospitalName: 'HealthCare Medical Center',
    language: 'en',
    timezone: 'UTC+2',
    notifications: true,
    autoBackup: true
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = () => {
    alert('Settings saved successfully!');
  };

  const tabs = [
    { id: 'general', label: 'General', icon: 'fas fa-cog' },
    { id: 'notifications', label: 'Notifications', icon: 'fas fa-bell' },
    { id: 'security', label: 'Security', icon: 'fas fa-shield-alt' },
    { id: 'about', label: 'About', icon: 'fas fa-info-circle' }
  ];

  return (
    <div className="settings-page">
      <div className="page-header">
        <h2>System Settings</h2>
        <p>Configure your healthcare system preferences</p>
      </div>
      
      <div className="page-content">
        <div className="settings-layout">
          <div className="settings-sidebar">
            <div className="card">
              <div className="card-body">
                <nav className="settings-nav">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <i className={tab.icon}></i>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>

          <div className="settings-content">
            <div className="card">
              <div className="card-header">
                <h3>
                  {tabs.find(tab => tab.id === activeTab)?.label} Settings
                </h3>
                <button className="btn btn-primary" onClick={handleSaveSettings}>
                  <i className="fas fa-save"></i>
                  Save Changes
                </button>
              </div>

              <div className="card-body">
                {activeTab === 'general' && (
                  <div className="settings-section">
                    <h4>General Settings</h4>
                    <div className="settings-form">
                      <div className="form-group">
                        <label>Hospital Name</label>
                        <input
                          type="text"
                          value={settings.hospitalName}
                          onChange={(e) => handleSettingChange('hospitalName', e.target.value)}
                        />
                      </div>
                      
                      <div className="form-row">
                        <div className="form-group">
                          <label>Language</label>
                          <select
                            value={settings.language}
                            onChange={(e) => handleSettingChange('language', e.target.value)}
                          >
                            <option value="en">English</option>
                            <option value="ar">Arabic</option>
                          </select>
                        </div>
                        
                        <div className="form-group">
                          <label>Timezone</label>
                          <select
                            value={settings.timezone}
                            onChange={(e) => handleSettingChange('timezone', e.target.value)}
                          >
                            <option value="UTC+2">UTC+2 (Cairo)</option>
                            <option value="UTC+1">UTC+1</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div className="settings-section">
                    <h4>Notification Settings</h4>
                    <div className="settings-list">
                      <div className="setting-item">
                        <div className="setting-info">
                          <h5>Push Notifications</h5>
                          <p>Receive alerts for new appointments and updates</p>
                        </div>
                        <label className="switch">
                          <input
                            type="checkbox"
                            checked={settings.notifications}
                            onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                          />
                          <span className="slider"></span>
                        </label>
                      </div>
                      
                      <div className="setting-item">
                        <div className="setting-info">
                          <h5>Auto Backup</h5>
                          <p>Automatically backup medical records daily</p>
                        </div>
                        <label className="switch">
                          <input
                            type="checkbox"
                            checked={settings.autoBackup}
                            onChange={(e) => handleSettingChange('autoBackup', e.target.checked)}
                          />
                          <span className="slider"></span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="settings-section">
                    <h4>Security Settings</h4>
                    <div className="security-info">
                      <div className="security-item">
                        <i className="fas fa-shield-alt"></i>
                        <div>
                          <h5>Data Encryption</h5>
                          <p>All patient data is encrypted and secure</p>
                        </div>
                      </div>
                      
                      <div className="security-item">
                        <i className="fas fa-user-lock"></i>
                        <div>
                          <h5>Access Control</h5>
                          <p>Role-based access control system</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'about' && (
                  <div className="settings-section">
                    <h4>About HealthCare System</h4>
                    <div className="about-info">
                      <div className="app-logo">
                        <i className="fas fa-hospital"></i>
                        <span>HealthCare System</span>
                      </div>
                      
                      <div className="about-details">
                        <div className="detail-item">
                          <label>Version</label>
                          <span>1.0.0</span>
                        </div>
                        <div className="detail-item">
                          <label>Last Updated</label>
                          <span>{new Date().toLocaleDateString()}</span>
                        </div>
                        <div className="detail-item">
                          <label>Database</label>
                          <span>MongoDB</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;