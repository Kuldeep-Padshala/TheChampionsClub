export function welcomeEmailTemplate(name: string): { subject: string; html: string } {
  return {
    subject: `Welcome to TheChampionsClub, ${name}! 🎉`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif; }
    .wrapper { width: 100%; background-color: #f4f4f7; padding: 40px 0; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 40px 32px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
    .body { padding: 40px; }
    .greeting { font-size: 20px; font-weight: 600; color: #1a1a2e; margin-bottom: 16px; }
    .text { font-size: 15px; color: #555770; line-height: 1.7; margin-bottom: 16px; }
    .cta { display: inline-block; margin: 24px 0; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 600; }
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
        <p class="greeting">Welcome, ${name}! 👋</p>
        <p class="text">We're thrilled to have you on board. Your account has been created successfully and you're all set to get started.</p>
        <p class="text">If you have any questions or need help, our support team is always here for you.</p>
        <p class="text">Enjoy your experience!</p>
        <p class="text" style="margin-top: 32px;">— TheChampionsClub Team</p>
      </div>
      <div class="footer">
        <p>You received this email because you created an account at TheChampionsClub.<br>If this wasn't you, please ignore this email.</p>
      </div>
    </div>
  </div>
</body>
</html>`,
  };
}