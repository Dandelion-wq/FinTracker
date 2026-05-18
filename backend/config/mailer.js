const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendVerificationCode = async (email, code, type) => {
    let subject, text;
    
    if (type === 'email_verification') {
        subject = 'Подтверждение регистрации в FinTracker';
        text = `Ваш код подтверждения: ${code}\n\nКод действителен в течение 15 минут.\n\nЕсли вы не регистрировались в FinTracker, проигнорируйте это письмо.`;
    } else if (type === 'password_reset') {
        subject = 'Восстановление пароля FinTracker';
        text = `Ваш код для сброса пароля: ${code}\n\nКод действителен в течение 15 минут.\n\nЕсли вы не запрашивали сброс пароля, проигнорируйте это письмо.`;
    }
    
    await transporter.sendMail({
        from: `"FinTracker" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: subject,
        text: text
    });
};

module.exports = { sendVerificationCode };