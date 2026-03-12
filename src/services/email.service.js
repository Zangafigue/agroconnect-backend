const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

const sendOtpEmail = async (email, firstName, otp) => {
  await resend.emails.send({
    from: `${process.env.FROM_NAME || 'AgroConnect BF'} <${process.env.FROM_EMAIL}>`,
    to:   email,
    subject: '🌾 Votre code de vérification AgroConnect BF',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Bonjour ${firstName} 👋</h2>
        <p>Votre code de vérification est :</p>
        <div style="background: #f0fdf4; border: 2px solid #16a34a; border-radius: 12px; text-align: center; padding: 24px; margin: 20px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #16a34a;">${otp}</span>
        </div>
        <p style="color: #6b7280;">Ce code expire dans <strong>10 minutes</strong>.</p>
        <p style="color: #6b7280;">Si vous n'avez pas créé de compte, ignorez cet email.</p>
        <hr style="border-color: #e5e7eb;" />
        <p style="color: #9ca3af; font-size: 12px;">AgroConnect BF — Plateforme agricole du Burkina Faso</p>
      </div>
    `,
  });
};

const sendPasswordResetEmail = async (email, firstName, otp) => {
  await resend.emails.send({
    from: `${process.env.FROM_NAME || 'AgroConnect BF'} <${process.env.FROM_EMAIL}>`,
    to:   email,
    subject: '🔑 Réinitialisation de votre mot de passe AgroConnect BF',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Bonjour ${firstName}</h2>
        <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
        <div style="background: #fff7ed; border: 2px solid #d97706; border-radius: 12px; text-align: center; padding: 24px; margin: 20px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #d97706;">${otp}</span>
        </div>
        <p style="color: #6b7280;">Ce code expire dans <strong>10 minutes</strong>.</p>
      </div>
    `,
  });
};

module.exports = { sendOtpEmail, sendPasswordResetEmail };
