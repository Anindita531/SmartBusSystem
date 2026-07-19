import crypto from 'crypto';

export const generateExitCode = (bookingId) => {
  const minute = Math.floor(Date.now() / 60000);
  const secret = process.env.EXIT_CODE_SECRET;
  const hash = crypto.createHash('sha256')
    .update(bookingId + secret + minute)
    .digest('hex')
    .slice(0, 6)
    .toUpperCase();
  return hash;
};

export const verifyExitCode = (code, bookingId) => {
  const currentMinute = Math.floor(Date.now() / 60000);
  for (let i = -1; i <= 1; i++) {
    const minute = currentMinute + i;
    const validCode = crypto.createHash('sha256')
      .update(bookingId + process.env.EXIT_CODE_SECRET + minute)
      .digest('hex')
      .slice(0, 6)
      .toUpperCase();
    if (validCode === code) return true;
  }
  return false;
};