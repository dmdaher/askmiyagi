import { NextRequest, NextResponse } from 'next/server';

/** Temporary debug route — DELETE after auth is working */
export async function GET(request: NextRequest) {
  const contractorEnv = process.env.CONTRACTOR_PASSWORD;
  const adminEnv = process.env.ADMIN_PASSWORD;
  const editorMode = process.env.NEXT_PUBLIC_EDITOR_MODE;
  const contractorCookie = request.cookies.get('contractor_access')?.value;
  const adminCookie = request.cookies.get('admin_access')?.value;

  return NextResponse.json({
    envVars: {
      CONTRACTOR_PASSWORD_SET: !!contractorEnv,
      CONTRACTOR_PASSWORD_LENGTH: contractorEnv?.length ?? 0,
      CONTRACTOR_PASSWORD_FIRST3: contractorEnv?.slice(0, 3) ?? '(unset)',
      CONTRACTOR_PASSWORD_LAST3: contractorEnv?.slice(-3) ?? '(unset)',
      ADMIN_PASSWORD_SET: !!adminEnv,
      NEXT_PUBLIC_EDITOR_MODE: editorMode ?? '(unset)',
    },
    cookies: {
      contractor_access_SET: !!contractorCookie,
      contractor_access_LENGTH: contractorCookie?.length ?? 0,
      contractor_access_FIRST3: contractorCookie?.slice(0, 3) ?? '(unset)',
      contractor_access_LAST3: contractorCookie?.slice(-3) ?? '(unset)',
      MATCH: contractorCookie === contractorEnv,
    },
  });
}
