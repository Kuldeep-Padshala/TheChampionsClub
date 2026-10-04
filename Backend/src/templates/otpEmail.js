function otpEmailTemplate(otp) {
  return {
    subject: 'Your Password Reset Code — TheChampionsClub',
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset OTP</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif; }
    .wrapper { width: 100%; background-color: #f4f4f7; padding: 40px 0; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 40px 32px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
    .body { padding: 40px; }
    .greeting { font-size: 20px; font-weight: 600; color: #1a1a2e; margin-bottom: 16px; }
    .text { font-size: 15px; color: #555770; line-height: 1.7; margin-bottom: 16px; }
    .otp-box { background: #f4f4f7; border-radius: 12px; padding: 24px; text-align: center; margin: 28px 0; }
    .otp-code { font-size: 48px; font-weight: 800; letter-spacing: 12px; color: #667eea; font-family: 'Courier New', monospace; }
    .otp-label { font-size: 12px; color: #9b9fb5; margin-top: 8px; text-transform: uppercase; letter-spacing: 1px; }
    .warning { background: #fff7ed; border-left: 4px solid #f97316; padding: 12px 16px; border-radius: 4px; font-size: 13px; color: #9a3412; margin-top: 24px; }
    .footer { background: #f4f4f7; padding: 24px 40px; text-align: center; }
    .footer p { font-size: 12px; color: #9b9fb5; margin: 0; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>TheChampionsClub</h1>
      </div>
      <div class="body">
        <p class="greeting">Password Reset Request</p>
        <p class="text">We received a request to reset your password. Use the verification code below to proceed. This code expires in <strong>10 minutes</strong>.</p>
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
          <div class="otp-label">Your 6-digit verification code</div>
        </div>
        <p class="text">Enter this code on the password reset page. You have a maximum of <strong>5 attempts</strong>.</p>
        <div class="warning">
          ⚠️ If you did not request a password reset, please ignore this email. Your account is safe — no changes have been made.
        </div>
      </div>
      <div class="footer">
        <p>This is an automated message from TheChampionsClub. Please do not reply to this email.<br>The code will expire in 10 minutes for your security.</p>
      </div>
    </div>
  </div>
</body>
</html>`,
  };
}

module.exports = { otpEmailTemplate };
