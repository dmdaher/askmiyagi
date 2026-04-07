import { NextRequest, NextResponse } from 'next/server';

/** GET /api/hosted/me — returns current role based on cookies vs env vars */
export async function GET(request: NextRequest) {
  const adminCookie = request.cookies.get('admin_access')?.value;
  const contractorCookie = request.cookies.get('contractor_access')?.value;

  const isAdmin = !!process.env.ADMIN_PASSWORD && adminCookie === process.env.ADMIN_PASSWORD;
  const isContractor = !!process.env.CONTRACTOR_PASSWORD && contractorCookie === process.env.CONTRACTOR_PASSWORD;

  return NextResponse.json({
    role: isAdmin ? 'admin' : isContractor ? 'contractor' : null,
  });
}
