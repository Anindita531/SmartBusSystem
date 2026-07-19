import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

const emailWrapper = (content) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background:#0f172a;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:20px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:12px;overflow:hidden;max-width:600px;">
                ${content}
                <tr>
                  <td style="background:#0f172a;padding:20px;text-align:center;">
                    <p style="color:#64748b;font-size:12px;margin:0;">
                      © 2026 Smart Shuttle Bus. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `
}

const headerSection = (title, color, icon) => {
  return `
    <tr>
      <td style="background:${color};padding:30px;text-align:center;">
        <div style="font-size:48px;margin-bottom:10px;">${icon}</div>
        <h1 style="color:white;margin:0;font-size:28px;font-weight:bold;">${title}</h1>
      </td>
    </tr>
  `
}

const infoRow = (label, value) => {
  if (!value) return ''
  return `
    <tr>
      <td style="padding:15px 30px;border-bottom:1px solid #334155;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="color:#94a3b8;font-size:14px;width:40%;">${label}</td>
            <td style="color:#ffffff;font-size:15px;font-weight:600;text-align:right;">${value}</td>
          </tr>
        </table>
      </td>
    </tr>
  `
}

export const sendTicketEmail = async (to, booking, type = 'confirmed') => {
  let subject = ''
  let content = ''

  if (type === 'otp') {
    subject = `Your OTP Code - Smart Shuttle`
    content = `
      ${headerSection('OTP Verification', '#3b82f6', '🔐')}
      <tr>
        <td style="padding: 30px; text-align: center;">
          <p style="color: #cbd5e1; font-size: 15px; margin: 0 0 20px 0;">
            Your OTP code is:
          </p>
          <div style="background:#1e293b;border:2px dashed #3b82f6;border-radius:8px;padding:20px;margin:20px 0;">
            <span style="color:#60a5fa;font-size:36px;font-weight:bold;letter-spacing:8px;">${booking.otp}</span>
          </div>
          <p style="color: #94a3b8; font-size: 13px;">
            Valid for 10 minutes. Do not share with anyone.
          </p>
        </td>
      </tr>
    `
  } else if (type === 'cancelled') {
    subject = `Booking Cancelled - ${booking.pnr}`
    content = `
      ${headerSection('Booking Cancelled', '#ef4444', '❌')}
      <tr>
        <td style="padding: 30px;">
          <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
            Your booking has been cancelled successfully.
          </p>
        </td>
      </tr>
      ${infoRow('PNR Number', booking.pnr)}
      ${infoRow('Bus', booking.bus.busName)}
      ${infoRow('Route', `${booking.bus.from} → ${booking.bus.to}`)}
      ${infoRow('Journey Date', new Date(booking.journeyDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))}
      ${infoRow('Seats', booking.seats.join(', '))}
      ${booking.refundAmount > 0 ? infoRow('Refund Amount', `₹${booking.refundAmount}`) : ''}
    `
  } else if (type === 'fine') {
    subject = `⚠️ Fine Issued - PNR: ${booking.pnr}`
    const payLink = `${process.env.CLIENT_URL}/pay-fine/${booking._id}`
    content = `
      ${headerSection('Fine Issued', '#dc2626', '⚠️')}
      <tr>
        <td style="padding: 30px;">
          <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
            A fine has been issued for your journey due to violation of boarding rules.
          </p>
        </td>
      </tr>
      ${infoRow('PNR Number', booking.pnr)}
      ${infoRow('Passenger', booking.user.name)}
      ${infoRow('Bus', booking.bus.busName)}
      ${infoRow('Route', `${booking.boardingPoint} → ${booking.droppingPoint}`)}
      ${infoRow('Fine Amount', `<span style="color:#f87171;font-size:20px;font-weight:700;">₹${booking.fineAmount}</span>`)}
      ${infoRow('Reason', booking.fineReason)}
      <tr>
        <td style="padding: 30px; text-align: center;">
          <a href="${payLink}" style="display:inline-block;background:#dc2626;color:white;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">
            Pay Fine Now
          </a>
          <p style="color: #94a3b8; font-size: 13px; margin-top: 16px;">
            Please pay within 24 hours to avoid additional penalty.
          </p>
        </td>
      </tr>
    `
  } else if (type === 'fine-paid') {
    subject = `✅ Fine Payment Receipt - PNR: ${booking.pnr}`
    content = `
      ${headerSection('Fine Payment Receipt', '#16a34a', '✅')}
      <tr>
        <td style="padding: 30px;">
          <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
            Your fine payment has been received successfully. Thank you for your cooperation.
          </p>
        </td>
      </tr>
      ${infoRow('PNR Number', booking.pnr)}
      ${infoRow('Passenger', booking.user.name)}
      ${infoRow('Phone', booking.user.phone)}
      ${infoRow('Bus', booking.bus.busName)}
      ${infoRow('Bus Number', booking.bus.busNumber)}
      ${infoRow('Route', `${booking.boardingPoint} → ${booking.droppingPoint}`)}
      ${infoRow('Fine Amount Paid', `<span style="color:#22c55e;font-size:20px;font-weight:700;">₹${booking.fineAmount}</span>`)}
      ${infoRow('Payment Mode', booking.finePaymentMode?.toUpperCase() || 'ONLINE')}
      ${infoRow('Transaction ID', booking.finePaymentId || booking.fineTransactionId || 'TXN' + Date.now())}
      ${infoRow('Payment Date', new Date(booking.finePaidAt || Date.now()).toLocaleString('en-IN', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Asia/Kolkata'
      }))}
      ${infoRow('Reason', booking.fineReason)}
      ${infoRow('Payment Status', '<span style="color: #22c55e; font-weight: 700;">✓ PAID</span>')}
      <tr>
        <td style="padding: 30px; text-align: center; border-top: 1px solid #334155;">
          <p style="color: #94a3b8; font-size: 13px; margin: 0 0 10px 0;">
            This is your official payment receipt. Please save it for your records.
          </p>
          <p style="color: #64748b; font-size: 11px; margin: 0;">
            For any queries, contact support@smartshuttle.com
          </p>
        </td>
      </tr>
    `
  } else {
    subject = `Ticket Confirmed - ${booking.pnr}`
    content = `
      ${headerSection('Ticket Confirmed', '#3b82f6', '✅')}
      <tr>
        <td style="padding: 30px;">
          <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
            Your booking is confirmed! Please carry a valid ID proof during your journey.
          </p>
        </td>
      </tr>
      ${infoRow('PNR Number', booking.pnr)}
      ${infoRow('Bus Name', booking.bus.busName)}
      ${infoRow('Route', `${booking.bus.from} → ${booking.bus.to}`)}
      ${infoRow('Journey Date', new Date(booking.journeyDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))}
      ${infoRow('Departure Time', booking.bus.departureTime)}
      ${infoRow('Seat Numbers', booking.seats.join(', '))}
      ${infoRow('Boarding Point', booking.boardingPoint)}
      ${infoRow('Dropping Point', booking.droppingPoint)}
      ${infoRow('Total Amount', `₹${booking.totalAmount}`)}
    `
  }

  const html = emailWrapper(content)

  try {
    await transporter.sendMail({
      from: `"Smart Shuttle" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    })
    console.log('✅ Mail sent to:', to, 'Type:', type)
  } catch (err) {
    console.log('❌ Mail error:', err.message)
    throw err
  }
}

// ✅ Alias for backward compatibility
export const sendEmail = sendTicketEmail