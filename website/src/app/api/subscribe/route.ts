import { NextRequest, NextResponse } from 'next/server'

const FORM_ID = '9203641'
const API_KEY = process.env.CONVERTKIT_API_KEY

const kitHeaders = {
  'Content-Type': 'application/json',
  'X-Kit-Api-Key': API_KEY!,
}

export async function POST(request: NextRequest) {
  const { email } = await request.json()
  if (!email || !email.trim()) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
  }
  try {
    // Step 1: Create subscriber (upserts if already exists)
    const createRes = await fetch('https://api.kit.com/v4/subscribers', {
      method: 'POST',
      headers: kitHeaders,
      body: JSON.stringify({ email_address: email, state: 'active' }),
    })
    if (!createRes.ok) {
      const data = await createRes.json()
      return NextResponse.json({ error: data.errors?.[0] ?? 'Subscription failed.' }, { status: createRes.status })
    }

    // Step 2: Add subscriber to form
    const formRes = await fetch(`https://api.kit.com/v4/forms/${FORM_ID}/subscribers`, {
      method: 'POST',
      headers: kitHeaders,
      body: JSON.stringify({ email_address: email }),
    })
    if (!formRes.ok) {
      const data = await formRes.json()
      return NextResponse.json({ error: data.errors?.[0] ?? 'Subscription failed.' }, { status: formRes.status })
    }

    return NextResponse.json({ message: 'Success!' })
  } catch {
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
