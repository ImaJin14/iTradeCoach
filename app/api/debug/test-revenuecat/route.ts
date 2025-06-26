import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }

  const secretKey = process.env.REVENUECAT_SECRET_API_KEY;
  
  if (!secretKey) {
    return NextResponse.json({
      error: 'REVENUECAT_SECRET_API_KEY not found',
      availableEnvVars: Object.keys(process.env).filter(key => key.includes('REVENUECAT'))
    });
  }

  try {
    // Test the API connection with a simple call
    const response = await fetch('https://api.revenuecat.com/v1/projects', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    const result = {
      status: response.status,
      ok: response.ok,
      keyPrefix: secretKey.substring(0, 10) + '...',
      headers: Object.fromEntries(response.headers.entries())
    };

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        success: true,
        ...result,
        projectsCount: data?.projects?.length || 0
      });
    } else {
      const errorText = await response.text();
      return NextResponse.json({
        success: false,
        ...result,
        error: errorText
      });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}