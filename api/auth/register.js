import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
}
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...corsHeaders() }
  });
}

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders() });
}

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) return json({ error: 'Faltan datos' }, 400);

    const exists = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (exists.rowCount > 0) return json({ error: 'Email ya registrado' }, 409);

    const hash = await bcrypt.hash(password, 10);
    await sql`INSERT INTO users (email, password_hash) VALUES (${email}, ${hash})`;
    return json({ ok: true }, 201);
  } catch (err) {
    console.error(err);
    return json({ error: 'Error del servidor' }, 500);
  }
}
