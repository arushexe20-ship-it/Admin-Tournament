export const validateEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

export const validateUPI = (upi: string): boolean => {
  const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z]+$/;
  return regex.test(upi);
};

export const validatePhone = (phone: string): boolean => {
  const regex = /^[6-9]\d{9}$/;
  return regex.test(phone);
};

export const validateGameUID = (uid: string): boolean => {
  return uid.trim().length > 0;
};
