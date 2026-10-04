const { registerUser } = require('./src/services/auth.service');
async function run() {
  try {
    await registerUser({ name: 'Rohan Gupta', email: 'new.member@example.com', password: 'Password@123', phone: '9999999999' });
    console.log('Done!');
  } catch(e) { console.error(e); }
  process.exit(0);
}
run();
