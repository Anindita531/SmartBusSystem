export const validatePhone = (phone) => {
  return /^[0-9]{10,14}$/.test(phone);
};