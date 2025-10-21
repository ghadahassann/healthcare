// Utility functions for healthcare calculations
export const calculateBMI = (weight, height) => {
  if (weight <= 0 || height <= 0) {
    throw new Error('Weight and height must be positive numbers');
  }
  const heightInMeters = height / 100;
  return (weight / (heightInMeters * heightInMeters)).toFixed(1);
};

export const getBMICategory = (bmi) => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};

export const calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

// Tests
describe('Healthcare Calculations', () => {
  describe('calculateBMI', () => {
    it('should calculate BMI correctly', () => {
      expect(calculateBMI(70, 175)).toBe('22.9');
      expect(calculateBMI(60, 165)).toBe('22.0');
    });

    it('should throw error for invalid inputs', () => {
      expect(() => calculateBMI(0, 175)).toThrow('Weight and height must be positive numbers');
      expect(() => calculateBMI(70, 0)).toThrow('Weight and height must be positive numbers');
      expect(() => calculateBMI(-5, 175)).toThrow('Weight and height must be positive numbers');
    });
  });

  describe('getBMICategory', () => {
    it('should return correct BMI categories', () => {
      expect(getBMICategory(17.5)).toBe('Underweight');
      expect(getBMICategory(22.0)).toBe('Normal weight');
      expect(getBMICategory(27.5)).toBe('Overweight');
      expect(getBMICategory(32.0)).toBe('Obese');
    });
  });

  describe('calculateAge', () => {
    it('should calculate age correctly', () => {
      const today = new Date();
      const birthDate = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());
      expect(calculateAge(birthDate.toISOString().split('T')[0])).toBe(25);
    });

    it('should handle birthday not yet occurred this year', () => {
      const today = new Date();
      const birthDate = new Date(today.getFullYear() - 25, today.getMonth() + 1, today.getDate());
      expect(calculateAge(birthDate.toISOString().split('T')[0])).toBe(24);
    });
  });
});