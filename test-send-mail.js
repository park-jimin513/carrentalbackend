require('dotenv').config();
const nodemailer = require('nodemailer');

(async () => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });

  try {
    console.log('Verifying transporter...');
    await transporter.verify();
    console.log('transporter ok');

    console.log('Sending test message to:', process.env.EMAIL_USER);
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: 'Test mail from local test-send-mail.js',
      text: 'If you receive this, SMTP/sendMail works.',
    });

    console.log('Mail sent:', info && (info.response || info));
  } catch (err) {
    console.error('mail error:', err && err.message);
    if (err && err.response) console.error('smtp response:', err.response);
    if (err && err.stack) console.error(err.stack);
    process.exitCode = 1;
  }
})();
