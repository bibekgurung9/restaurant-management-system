export const validatePhoneNumber = (phone: string) => {
  const phonePattern = /^[0-9]{10}$/; 
  return phonePattern.test(phone);
};
