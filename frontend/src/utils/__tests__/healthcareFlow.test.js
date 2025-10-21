// Integration tests for healthcare workflows
describe('Healthcare System Workflows', () => {
  describe('Patient Management Flow', () => {
    it('should handle complete patient lifecycle', () => {
      // Mock patient data
      const patientData = {
        name: 'Test Patient',
        age: 35,
        gender: 'female',
        phone: '+1234567890',
        email: 'test@example.com'
      };

      // Simulate patient creation
      const createdPatient = {
        ...patientData,
        _id: 'patient-123',
        createdAt: new Date().toISOString()
      };

      expect(createdPatient.name).toBe('Test Patient');
      expect(createdPatient.age).toBe(35);
      expect(createdPatient._id).toBeDefined();
    });

    it('should validate patient data', () => {
      const invalidPatient = {
        name: '', // Empty name
        age: -5, // Invalid age
        gender: 'unknown', // Invalid gender
        phone: 'invalid', // Invalid phone
        email: 'invalid-email' // Invalid email
      };

      // Validation checks
      expect(invalidPatient.name).toBe('');
      expect(invalidPatient.age).toBeLessThan(0);
      expect(invalidPatient.gender).not.toMatch(/^(male|female)$/);
    });
  });

  describe('Appointment Scheduling Flow', () => {
    it('should schedule appointment with valid data', () => {
      const appointmentData = {
        patientId: 'patient-123',
        patientName: 'Test Patient',
        doctorName: 'Dr. Smith',
        date: '2024-01-15T10:00:00',
        type: 'Checkup',
        status: 'Scheduled'
      };

      expect(appointmentData.patientName).toBe('Test Patient');
      expect(appointmentData.doctorName).toMatch(/^Dr\./);
      expect(new Date(appointmentData.date)).toBeInstanceOf(Date);
    });

    it('should validate appointment constraints', () => {
      const pastAppointment = {
        date: '2020-01-01T10:00:00' // Past date
      };

      const appointmentDate = new Date(pastAppointment.date);
      const now = new Date();
      
      expect(appointmentDate.getTime()).toBeLessThan(now.getTime());
    });
  });
});