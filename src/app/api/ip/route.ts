
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(/, /)[0] : request.ip;
  
  // In a Vercel environment, request.ip might be more reliable
  // For local development, x-forwarded-for might be set by the dev server proxy
  // or it might be undefined, and request.ip would be ::1 or 127.0.0.1
  
  let clientIp = ip;

  // Vercel specific header for client IP
  const vercelIp = request.headers.get('x-vercel-forwarded-for');
  if (vercelIp) {
    clientIp = vercelIp.split(/, /)[0];
  }
  
  // Fallback for local development if request.ip is available and not internal
  if (!clientIp || clientIp === '::1' || clientIp === '127.0.0.1') {
    if (request.ip && request.ip !== '::1' && request.ip !== '127.0.0.1') {
      clientIp = request.ip;
    } else if (forwarded) {
      clientIp = forwarded.split(/, /)[0];
    } else {
        clientIp = request.ip || "IP not found";
    }
  }


  return NextResponse.json({ ip: clientIp });
}
