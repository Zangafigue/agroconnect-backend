const { Resend } = require('resend');

// Utiliser une clé factice si non fournie dans le .env pour éviter que l'app crash en dev
const resendApiKey = process.env.RESEND_API_KEY || 're_dummy_key_for_dev_xxxxxxxxxxxxxx';
const resend = new Resend(resendApiKey);

const fromEmail = process.env.FROM_EMAIL || 'noreply@agroconnect.local';

const sendOtpEmail = async (email, firstName, otp) => {
  try {
    console.log(`[EMAIL MOCK] Envoi OTP ${otp} à ${email}`);
    
    // Si on a pas de vraie clé Resend, on ne tente pas l'appel API réseau pour éviter l'erreur
    if (resendApiKey.includes('dummy_key')) return;

    await resend.emails.send({
      from: fromEmail,
      to:   email,
      subject: '🌾 Votre code de vérification AgroConnect BF',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Bonjour ${firstName} 👋</h2>
          <p>Votre code de vérification est :</p>
          <div style="background: #f0fdf4; border: 2px solid #16a34a; border-radius: 12px;
                      text-align: center; padding: 24px; margin: 20px 0;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #16a34a;">
              ${otp}
            </span>
          </div>
          <p style="color: #6b7280;">Ce code expire dans <strong>10 minutes</strong>.</p>
          <p style="color: #6b7280;">Si vous n'avez pas créé de compte, ignorez cet email.</p>
          <hr style="border-color: #e5e7eb;" />
          <p style="color: #9ca3af; font-size: 12px;">AgroConnect BF — Plateforme agricole du Burkina Faso</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Erreur lors de l’envoi de l’email OTP:', error);
  }
};

const sendPasswordResetEmail = async (email, firstName, otp) => {
  try {
    console.log(`[EMAIL MOCK] Envoi Reset OTP ${otp} à ${email}`);
    
    if (resendApiKey.includes('dummy_key')) return;

    await resend.emails.send({
      from: fromEmail,
      to:   email,
      subject: '🔑 Réinitialisation de votre mot de passe AgroConnect BF',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Bonjour ${firstName}</h2>
          <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
          <div style="background: #fff7ed; border: 2px solid #d97706; border-radius: 12px;
                      text-align: center; padding: 24px; margin: 20px 0;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #d97706;">
              ${otp}
            </span>
          </div>
          <p style="color: #6b7280;">Ce code expire dans <strong>10 minutes</strong>.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Erreur lors de l’envoi de l’email de réinitialisation:', error);
  }
};

module.exports = { sendOtpEmail, sendPasswordResetEmail };
