import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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

    const { rows } = await sql`
      SELECT id, password_hash FROM users WHERE email = ${email}
    `;
    if (rows.length === 0) return json({ error: 'Credenciales inválidas' }, 401);

    const ok = await bcrypt.compare(password, rows[0].password_hash);
    if (!ok) return json({ error: 'Credenciales inválidas' }, 401);

    const token = jwt.sign(
      { sub: rows[0].id, email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return json({ token });
  } catch (err) {
    console.error(err);
    return json({ error: 'Error del servidor' }, 500);
  }
}
