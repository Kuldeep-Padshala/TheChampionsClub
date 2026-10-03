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

async function runEdgeCases() {
  console.log('🧪 [EDGE CASE & ADVANCED SUITE] Starting In-Depth Verification...');

  // 1. FRONT_DESK Registration Flow
  const rand = Math.floor(10000 + Math.random() * 90000);
  const staffEmail = `staff_${rand}@thechampionsclub.in`;
  console.log(`1. Testing Registration with FRONT_DESK role: ${staffEmail}`);
  const staffReg = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      name: `Staff Member ${rand}`,
      email: staffEmail,
      password: 'StaffPass@123',
      role: 'FRONT_DESK',
      phone: `98111${rand}`,
    }
  );
  console.log('   Staff Register Status:', staffReg.status, staffReg.data.user?.roles);
  if (staffReg.status !== 201 || !staffReg.data.user?.roles?.includes('FRONT_DESK')) {
    throw new Error('Front desk role registration failed: ' + JSON.stringify(staffReg.data));
  }

  // 2. Member Flow Setup
  const memberEmail = `edge_member_${rand}@thechampionsclub.in`;
  const memberReg = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      name: `Edge Member ${rand}`,
      email: memberEmail,
      password: 'MemberPass@123',
      role: 'MEMBER',
      phone: `98222${rand}`,
      date_of_birth: '1990-08-20',
    }
  );
  const memberToken = memberReg.data.token;
  const memberHeaders = {
    Authorization: `Bearer ${memberToken}`,
    'Content-Type': 'application/json',
  };

  // Get member details
  const me = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/members/me',
    method: 'GET',
    headers: memberHeaders,
  });
  const memberId = me.data.profile.id;

  // Login as existing FRONT_DESK
  const fdLogin = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'frontdesk@thechampionsclub.in', password: 'FrontDesk@123' }
  );
  const fdHeaders = {
    Authorization: `Bearer ${fdLogin.data.token}`,
    'Content-Type': 'application/json',
  };

  // 3. Test Frontdesk Assigning a Membership Plan & Generating Invoice
  console.log(`3. Front Desk Selling Platinum Membership to Member #${memberId}...`);
  const sellRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/receptionist/memberships',
      method: 'POST',
      headers: fdHeaders,
    },
    {
      member_id: memberId,
      plan_id: 2, // Platinum plan
      fee_charged: 14999,
      joining_fee_charged: 2000,
    }
  );
  console.log('   Sell Membership Status:', sellRes.status, 'Invoice No:', sellRes.data.invoice_no);
  if (sellRes.status !== 201 || !sellRes.data.invoiceId) {
    throw new Error('Sell membership failed: ' + JSON.stringify(sellRes.data));
  }
  const generatedInvoiceId = sellRes.data.invoiceId;

  // 4. Test Member Seeing the Newly Generated Invoice
  console.log('4. Verifying Member sees the generated invoice (GET /api/members/invoices/me)...');
  const memberInvoices = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/members/invoices/me',
    method: 'GET',
    headers: memberHeaders,
  });
  console.log('   Member Invoices found:', memberInvoices.data.data?.length);
  const invoiceFound = memberInvoices.data.data?.find((i) => i.id === generatedInvoiceId);
  if (!invoiceFound) throw new Error('Invoice not found in member invoices list');
  console.log('   Invoice Found:', invoiceFound.invoice_no, 'Balance Due: ₹' + invoiceFound.balance_due);

  // 5. Test Member Self-Service Online Payment
  console.log(`5. Member paying ₹5000 online against Invoice #${generatedInvoiceId}...`);
  const onlinePayRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/members/payments/me/online',
      method: 'POST',
      headers: memberHeaders,
    },
    {
      invoice_id: generatedInvoiceId,
      amount: 5000,
      method: 'upi',
    }
  );
  console.log('   Online Pay Status:', onlinePayRes.status, 'Receipt:', onlinePayRes.data.receipt_no);
  if (onlinePayRes.status !== 201) throw new Error('Online payment failed: ' + JSON.stringify(onlinePayRes.data));

  // 6. Test Front Desk Recording Offline Payment for Remaining Balance
  const remainingDue = 16999 - 5000;
  console.log(`6. Front Desk Recording Cash Payment for remaining ₹${remainingDue}...`);
  const fdPayRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/receptionist/payments',
      method: 'POST',
      headers: fdHeaders,
    },
    {
      invoice_id: generatedInvoiceId,
      amount: remainingDue,
      method: 'cash',
      notes: 'Cleared at front counter with cash receipt',
    }
  );
  console.log('   Front Desk Record Payment Status:', fdPayRes.status, fdPayRes.data.message);
  if (fdPayRes.status !== 201) throw new Error('Front desk record payment failed: ' + JSON.stringify(fdPayRes.data));

  // 7. Verify Invoice is now Fully Paid
  console.log('7. Verifying Invoice Status is now "paid"...');
  const verifyInvoices = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/members/invoices/me',
    method: 'GET',
    headers: memberHeaders,
  });
  const updatedInv = verifyInvoices.data.data?.find((i) => i.id === generatedInvoiceId);
  console.log('   Updated Invoice Status:', updatedInv.status, 'Balance Due:', updatedInv.balance_due);
  if (Number(updatedInv.balance_due) !== 0 || updatedInv.status !== 'paid') {
    throw new Error('Invoice was not marked paid: ' + JSON.stringify(updatedInv));
  }

  // 8. Test Court Double-Booking Conflict Prevention (409)
  const randomOffset = Math.floor(10 + Math.random() * 50);
  const futureDay = new Date(Date.now() + randomOffset * 86400000).toISOString().split('T')[0];
  console.log(`8. Booking Court 1 for ${futureDay} from 18:00 to 19:00...`);
  const firstBooking = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/members/bookings/me',
      method: 'POST',
      headers: memberHeaders,
    },
    {
      court_id: 1,
      starts_at: `${futureDay} 18:00:00`,
      ends_at: `${futureDay} 19:00:00`,
      reservation_type: 'exclusive',
    }
  );
  console.log('   First Booking Status:', firstBooking.status);
  if (firstBooking.status !== 201) throw new Error('First booking failed');

  console.log('   Attempting Conflicting Booking on Court 1 for overlapping slot 18:30 to 19:30 (Expect 409)...');
  const conflictBooking = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/members/bookings/me',
      method: 'POST',
      headers: memberHeaders,
    },
    {
      court_id: 1,
      starts_at: `${futureDay} 18:30:00`,
      ends_at: `${futureDay} 19:30:00`,
      reservation_type: 'exclusive',
    }
  );
  console.log('   Conflict Booking Status:', conflictBooking.status, conflictBooking.data.message);
  if (conflictBooking.status !== 409) {
    throw new Error(`Double-booking conflict was not blocked! Status: ${conflictBooking.status}`);
  }

  // 9. Test Daily Booking Limit (Max 2 bookings per day -> 429)
  console.log(`9. Testing Member Daily Booking Quota limit (2 bookings per day)...`);
  // Book 2nd slot for futureDay
  const secondBooking = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/members/bookings/me',
      method: 'POST',
      headers: memberHeaders,
    },
    {
      court_id: 2,
      starts_at: `${futureDay} 10:00:00`,
      ends_at: `${futureDay} 11:00:00`,
      reservation_type: 'exclusive',
    }
  );
  console.log('   Second Booking Status:', secondBooking.status);
  if (secondBooking.status !== 201) throw new Error('Second booking failed');

  // Attempt 3rd slot for futureDay (should fail with 429)
  console.log('   Attempting 3rd booking on same date (Expect 429 Quota Exceeded)...');
  const thirdBooking = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/members/bookings/me',
      method: 'POST',
      headers: memberHeaders,
    },
    {
      court_id: 3,
      starts_at: `${futureDay} 12:00:00`,
      ends_at: `${futureDay} 13:00:00`,
      reservation_type: 'exclusive',
    }
  );
  console.log('   Third Booking Status:', thirdBooking.status, thirdBooking.data.message);
  if (thirdBooking.status !== 429) {
    throw new Error(`Daily limit was not enforced! Status: ${thirdBooking.status}`);
  }

  console.log('\n🎉 [SUCCESS] ALL ADVANCED EDGE CASES, CONFLICT PREVENTIONS & BILLING FLOWS PASSED 100%!');
}

runEdgeCases().catch((err) => {
  console.error('\n❌ [EDGE CASE FAILURE]:', err.message);
  process.exit(1);
});
