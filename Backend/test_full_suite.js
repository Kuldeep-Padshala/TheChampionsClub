const http = require('http');

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  console.log('🚀 [TEST SUITE] Starting Complete System Verification...');

  // 1. Health
  const health = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/health',
    method: 'GET',
  });
  console.log('1. Health Check:', health.status, health.data);
  if (health.status !== 200) throw new Error('Health check failed');

  // 2. Member Register
  const rand = Math.floor(10000 + Math.random() * 90000);
  const memberEmail = `e2e_member_${rand}@thechampionsclub.in`;
  const memberPass = 'MemberPass@123';
  console.log(`2. Registering Member: ${memberEmail}`);

  const regMember = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      name: `VIP Member ${rand}`,
      email: memberEmail,
      password: memberPass,
      role: 'MEMBER',
      phone: `99887${rand}`,
      date_of_birth: '1992-04-12',
    }
  );
  console.log('   Member Register Status:', regMember.status, regMember.data.message || regMember.data);
  if (regMember.status !== 201) throw new Error('Member registration failed: ' + JSON.stringify(regMember.data));
  const memberToken = regMember.data.token;
  const memberAuthHeader = {
    Authorization: `Bearer ${memberToken}`,
    'Content-Type': 'application/json',
  };

  // 3. Member Login verification
  console.log('3. Logging in as registered Member...');
  const memberLogin = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: memberEmail, password: memberPass }
  );
  console.log('   Member Login Status:', memberLogin.status, 'Roles:', memberLogin.data.user?.roles);
  if (memberLogin.status !== 200 || !memberLogin.data.user?.roles?.includes('MEMBER')) {
    throw new Error('Member login failed: ' + JSON.stringify(memberLogin.data));
  }

  // 4. Get Member Profile
  console.log('4. Fetching Member Profile (GET /api/members/me)...');
  const meRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/members/me',
    method: 'GET',
    headers: memberAuthHeader,
  });
  console.log('   Profile:', meRes.status, {
    full_name: meRes.data.profile?.full_name,
    member_code: meRes.data.profile?.member_code,
    tier: meRes.data.active_membership?.plan_name,
    qr_token: meRes.data.profile?.qr_token ? 'Present' : 'Missing',
  });
  if (meRes.status !== 200 || !meRes.data.profile?.member_code) {
    throw new Error('Member profile get failed: ' + JSON.stringify(meRes.data));
  }
  const memberQrToken = meRes.data.profile.qr_token;
  const memberCode = meRes.data.profile.member_code;

  // 5. Update Profile
  console.log('5. Updating Member Profile (PATCH /api/members/me)...');
  const updateRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/members/me',
      method: 'PATCH',
      headers: memberAuthHeader,
    },
    { phone: '9900011223', address_line1: '42 Prestige Golfshire' }
  );
  console.log('   Profile Updated:', updateRes.status, updateRes.data.profile?.phone);
  if (updateRes.status !== 200 || updateRes.data.profile?.phone !== '9900011223') {
    throw new Error('Member profile update failed: ' + JSON.stringify(updateRes.data));
  }

  // 6. Court Availability
  const today = new Date().toISOString().split('T')[0];
  console.log(`6. Checking Court Availability for ${today}...`);
  const availRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/members/courts/availability?date=${today}`,
    method: 'GET',
    headers: memberAuthHeader,
  });
  console.log('   Courts returned:', availRes.data.courts?.length);
  if (availRes.status !== 200 || !availRes.data.courts || availRes.data.courts.length === 0) {
    throw new Error('Court availability failed: ' + JSON.stringify(availRes.data));
  }
  const courtToBook = availRes.data.courts[0];

  // 7. Member Court Booking
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  console.log(`7. Creating Court Booking on court ${courtToBook.id} for ${tomorrow}...`);
  const bookRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/members/bookings/me',
      method: 'POST',
      headers: memberAuthHeader,
    },
    {
      court_id: courtToBook.id,
      starts_at: `${tomorrow} 16:00:00`,
      ends_at: `${tomorrow} 17:00:00`,
      reservation_type: 'exclusive',
      notes: 'Automated E2E Test Booking',
    }
  );
  console.log('   Booking Result:', bookRes.status, bookRes.data);
  if (bookRes.status !== 201) throw new Error('Member booking failed: ' + JSON.stringify(bookRes.data));
  const bookingId = bookRes.data.bookingId;

  // 8. List My Bookings
  console.log('8. Listing Member Bookings...');
  const myBookingsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/members/bookings/me',
    method: 'GET',
    headers: memberAuthHeader,
  });
  console.log('   My Bookings count:', myBookingsRes.data.data?.length);
  const foundBooking = myBookingsRes.data.data?.find((b) => b.id === bookingId);
  if (!foundBooking) throw new Error('Created booking not found in member bookings list');

  // 9. Cancel Member Booking
  console.log(`9. Cancelling Member Booking #${bookingId}...`);
  const cancelRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/members/bookings/me/${bookingId}/cancel`,
      method: 'POST',
      headers: memberAuthHeader,
    },
    {}
  );
  console.log('   Cancel Result:', cancelRes.status, cancelRes.data.message);
  if (cancelRes.status !== 200) throw new Error('Member cancel booking failed: ' + JSON.stringify(cancelRes.data));

  // 10. Invoices Listing
  console.log('10. Listing Member Invoices...');
  const invoicesRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/members/invoices/me',
    method: 'GET',
    headers: memberAuthHeader,
  });
  console.log('    Invoices count:', invoicesRes.data.data?.length);
  if (invoicesRes.status !== 200) throw new Error('Member invoices get failed');

  // 11. Shop Products & Order
  console.log('11. Fetching Shop Products...');
  const shopRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/members/shop/products',
    method: 'GET',
    headers: memberAuthHeader,
  });
  console.log('    Shop Products count:', shopRes.data.data?.length);
  if (shopRes.status !== 200) throw new Error('Shop products get failed');

  if (shopRes.data.data?.length > 0) {
    const prod = shopRes.data.data[0];
    console.log(`    Placing order for product ${prod.id} (${prod.name}) @ ₹${prod.base_price}...`);
    const orderRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/members/shop/orders/me',
        method: 'POST',
        headers: memberAuthHeader,
      },
      {
        items: [{ product_id: prod.id, product_name: prod.name, quantity: 1, unit_price: Number(prod.base_price) || 1200 }],
        notes: 'VIP express pickup',
      }
    );
    console.log('    Order result:', orderRes.status, orderRes.data.order_no);
    if (orderRes.status !== 201) throw new Error('Shop order placement failed: ' + JSON.stringify(orderRes.data));

    console.log('    Verifying Shop Orders List (GET /api/members/shop/orders/me)...');
    const myOrdersRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/members/shop/orders/me',
      method: 'GET',
      headers: memberAuthHeader,
    });
    console.log('    Member Orders count:', myOrdersRes.data.data?.length);
    if (myOrdersRes.status !== 200 || myOrdersRes.data.data?.length === 0) {
      throw new Error('Shop orders list verification failed');
    }
  }

  // 12. Front Desk Authentication & Features
  console.log('\n--- 12. Testing Front Desk Integration ---');
  const frontDeskLogin = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'frontdesk@thechampionsclub.in', password: 'FrontDesk@123' }
  );
  console.log('    Front Desk Login Status:', frontDeskLogin.status, 'Roles:', frontDeskLogin.data.user?.roles);
  if (frontDeskLogin.status !== 200 || !frontDeskLogin.data.user?.roles?.includes('FRONT_DESK')) {
    throw new Error('Front desk login failed: ' + JSON.stringify(frontDeskLogin.data));
  }
  const fdToken = frontDeskLogin.data.token;
  const fdAuthHeader = {
    Authorization: `Bearer ${fdToken}`,
    'Content-Type': 'application/json',
  };

  // 13. Frontdesk Quick Search (Search by member code / name)
  console.log(`13. Front Desk Searching for newly created member ${memberCode}...`);
  const fdSearch = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/receptionist/members?search=${encodeURIComponent(memberCode)}`,
    method: 'GET',
    headers: fdAuthHeader,
  });
  console.log('    Search results:', fdSearch.status, 'Found:', fdSearch.data.data?.length);
  if (fdSearch.status !== 200 || fdSearch.data.data?.length === 0) {
    throw new Error('Front desk member search failed to find new member: ' + JSON.stringify(fdSearch.data));
  }
  const foundMemberId = fdSearch.data.data[0].id;

  // 14. Frontdesk Check-in by QR Token
  console.log(`14. Front Desk Checking in member via QR Token (${memberQrToken})...`);
  const checkinRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/receptionist/check-ins',
      method: 'POST',
      headers: fdAuthHeader,
    },
    { code: memberQrToken, method: 'qr_scanner' }
  );
  console.log('    Check-in result:', checkinRes.status, checkinRes.data.message || checkinRes.data);
  if (checkinRes.status !== 200 && checkinRes.status !== 201) {
    throw new Error('Front desk checkin by QR failed: ' + JSON.stringify(checkinRes.data));
  }

  // 15. Frontdesk Check-in by Member ID (Manual)
  console.log(`15. Front Desk Manual Check-in for Member ID ${foundMemberId}...`);
  const manualCheckin = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/receptionist/check-ins',
      method: 'POST',
      headers: fdAuthHeader,
    },
    { member_id: foundMemberId, method: 'manual' }
  );
  console.log('    Manual Check-in result:', manualCheckin.status, manualCheckin.data.message || manualCheckin.data);
  if (manualCheckin.status !== 200 && manualCheckin.status !== 201) {
    throw new Error('Front desk manual checkin failed: ' + JSON.stringify(manualCheckin.data));
  }

  // 16. Frontdesk Court Grid
  console.log('16. Front Desk Court Grid View...');
  const fdGrid = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/receptionist/courts/availability?date=${today}`,
    method: 'GET',
    headers: fdAuthHeader,
  });
  console.log('    Court grid status:', fdGrid.status, 'Courts count:', fdGrid.data.courts?.length);
  if (fdGrid.status !== 200) throw new Error('Front desk court grid failed');

  // 17. Frontdesk Invoices List
  console.log('17. Front Desk Invoices (Unpaid bills)...');
  const fdInvoices = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/receptionist/invoices?status=unpaid',
    method: 'GET',
    headers: fdAuthHeader,
  });
  console.log('    Unpaid invoices count:', fdInvoices.data.data?.length);
  if (fdInvoices.status !== 200) throw new Error('Front desk invoices list failed');

  // 18. Frontdesk Enquiries (Leads)
  console.log('18. Front Desk Enquiry creation...');
  const enqRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/receptionist/enquiries',
      method: 'POST',
      headers: fdAuthHeader,
    },
    {
      full_name: 'Lead Prospect Sharma',
      phone: '9888877777',
      email: 'lead.sharma@example.com',
      message: 'Wants to tour club next Saturday',
    }
  );
  console.log('    Enquiry created:', enqRes.status, 'ID:', enqRes.data.enquiryId);
  if (enqRes.status !== 201 || !enqRes.data.enquiryId) throw new Error('Front desk enquiry creation failed: ' + JSON.stringify(enqRes.data));
  const enqId = enqRes.data.enquiryId;

  // 19. Update Enquiry
  console.log(`19. Front Desk Updating Enquiry #${enqId}...`);
  const enqUpdate = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/receptionist/enquiries/${enqId}`,
      method: 'PATCH',
      headers: fdAuthHeader,
    },
    {
      status: 'Contacted',
      note_summary: 'Contacted via phone. Confirmed visit on Saturday 11am.',
    }
  );
  console.log('    Enquiry updated:', enqUpdate.status, enqUpdate.data.message);
  if (enqUpdate.status !== 200) throw new Error('Front desk enquiry update failed: ' + JSON.stringify(enqUpdate.data));

  // 20. Negative Security Tests (RBAC checks)
  console.log('\n--- 20. RBAC Security Boundary Tests ---');

  // 20a. Member trying to access Frontdesk Endpoint (Forbidden)
  console.log('20a. Testing Member access to Frontdesk endpoint (Expect 403)...');
  const rbac1 = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/receptionist/enquiries',
    method: 'GET',
    headers: memberAuthHeader,
  });
  console.log('     Status:', rbac1.status, '(Expected: 403)');
  if (rbac1.status !== 403) throw new Error(`RBAC violation: Member accessed Frontdesk endpoint! Status: ${rbac1.status}`);

  // 20b. Frontdesk trying to access Member Portal Endpoint (Expect 403)
  console.log('20b. Testing Frontdesk access to Member Portal endpoint (Expect 403)...');
  const rbac2 = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/members/me',
    method: 'GET',
    headers: fdAuthHeader,
  });
  console.log('     Status:', rbac2.status, '(Expected: 403)');
  if (rbac2.status !== 403) throw new Error(`RBAC violation: Frontdesk accessed Member endpoint! Status: ${rbac2.status}`);

  // 20c. Unauthenticated request to protected endpoints (Expect 401)
  console.log('20c. Testing Unauthenticated access to /api/members/me (Expect 401)...');
  const rbac3 = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/members/me',
    method: 'GET',
  });
  console.log('     Status:', rbac3.status, '(Expected: 401)');
  if (rbac3.status !== 401) throw new Error(`RBAC violation: Unauthenticated accessed endpoint! Status: ${rbac3.status}`);

  console.log('\n🎉 [SUCCESS] ALL 20 API & RBAC TESTS COMPLETED WITH 100% SUCCESS!');
}

run().catch((err) => {
  console.error('\n❌ [TEST FAILURE]:', err.message);
  process.exit(1);
});
