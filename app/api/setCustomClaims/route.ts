import { NextRequest, NextResponse } from 'next/server';
import admin from '@/firebaseAdmin';

export async function POST(req: NextRequest) {
  const { uid, customClaims } = await req.json();

  try {
    console.info('Setting custom claims for user:', uid);
    await admin.auth().setCustomUserClaims(uid, customClaims);

    return NextResponse.json({ message: 'Custom claims set successfully' });
  } catch (error) {
    console.error('Error setting custom claims:', error);
    return NextResponse.json(
      { error: 'Error setting custom claims' },
      { status: 500 }
    );
  }
}
