const API_BASE_URL = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3002';

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  console.log(`🔄 API Call: ${url}`, options);

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    console.log(`📡 Response Status: ${response.status} for ${url}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error ${response.status}:`, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json().catch((error) => {
      throw new Error('Failed to parse JSON response.');
    });
    console.log(`✅ API Success for ${url}:`, data);
    return data;

  } catch (error) {
    console.error(`❌ API call failed for ${url}:`, error);

    if (error.message.includes('Failed to fetch')) {
      const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';
      throw new Error(`Cannot connect to server (${env}). Make sure backend is running.`);
    }

    throw error;
  }
}

// باقي الكود يبقى كما هو...
export const patientsAPI = {
  getAll: () => apiCall('/patients'),
  getById: (id) => apiCall(`/patients/${id}`),
  create: (patientData) => apiCall('/patients', {
    method: 'POST',
    body: JSON.stringify(patientData),
  }),
  update: (id, patientData) => apiCall(`/patients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(patientData),
  }),
  delete: (id) => apiCall(`/patients/${id}`, {
    method: 'DELETE',
  }),
};

// Appointments API
export const appointmentsAPI = {
  getAll: () => apiCall('/appointments'),
  getById: (id) => apiCall(`/appointments/${id}`),
  create: (appointmentData) => apiCall('/appointments', {
    method: 'POST',
    body: JSON.stringify(appointmentData),
  }),
  update: (id, appointmentData) => apiCall(`/appointments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(appointmentData),
  }),
  delete: (id) => apiCall(`/appointments/${id}`, {
    method: 'DELETE',
  }),
};

// Medical API
export const medicalAPI = {
  getStats: () => apiCall('/medical'),
};

// Seed API
export const seedAPI = {
  seedData: () => apiCall('/seed', {
    method: 'POST',
  }),
};

export const apiService = {
  patients: patientsAPI,
  appointments: appointmentsAPI,
  medical: medicalAPI,
  seed: seedAPI
};

export default apiCall;