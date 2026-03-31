import { NextResponse } from 'next/server';

export async function GET() {
  // Korven integration is temporarily disabled.
  return NextResponse.json([], {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
