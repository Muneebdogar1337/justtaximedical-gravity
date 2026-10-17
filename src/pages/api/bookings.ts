export const prerender = false;

import type { APIRoute } from 'astro';

// In-memory buffer for local dev / serverless edge invocations
const edgeBookings: Array<{
  id: string;
  reference: string;
  service: string;
  council: string;
  clinic: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  payment: string;
  status: string;
  created_at: string;
}> = [];

// Helper to safely access Cloudflare D1 environment if bound
async function getD1() {
  try {
    const cf = await import('cloudflare:workers' as any);
    return cf?.env?.DB || null;
  } catch {
    return null;
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const reference = 'JTM-' + Math.floor(100000 + Math.random() * 900000);
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);

    const booking = {
      id,
      reference,
      service: data.service || 'Taxi Medical (£60)',
      council: data.council || 'General UK Council',
      clinic: data.clinic || 'Manchester Central',
      date: data.date || new Date().toISOString().split('T')[0],
      time: data.time || '10:00',
      name: data.name || 'Driver',
      phone: data.phone || '',
      payment: data.payment || 'Pay on Arrival (£60)',
      status: 'Confirmed',
      created_at: new Date().toISOString()
    };

    // If Cloudflare D1 is bound
    const d1 = await getD1();
    if (d1) {
      try {
        await d1.prepare(`
          INSERT INTO bookings (id, reference, service, council, clinic, appointment_date, appointment_time, client_name, client_phone, payment_type, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          booking.id, booking.reference, booking.service, booking.council, booking.clinic,
          booking.date, booking.time, booking.name, booking.phone, booking.payment,
          booking.status, booking.created_at
        ).run();
      } catch (dbErr) {
        console.error('D1 insert notice:', dbErr);
      }
    }

    edgeBookings.unshift(booking);

    return new Response(JSON.stringify({
      success: true,
      reference,
      booking
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({
      error: 'Failed to process booking',
      details: err?.message
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const GET: APIRoute = async () => {
  const d1 = await getD1();
  if (d1) {
    try {
      const { results } = await d1.prepare('SELECT * FROM bookings ORDER BY created_at DESC LIMIT 100').all();
      return new Response(JSON.stringify(results), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      console.error('D1 query notice:', err);
    }
  }

  return new Response(JSON.stringify(edgeBookings), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
