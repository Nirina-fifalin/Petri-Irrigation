import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { pnml } = await request.json();

    if (!pnml) {
      return NextResponse.json(
        { error: 'PNML content is required' },
        { status: 400 }
      );
    }

    return new NextResponse(pnml, {
      headers: {
        'Content-Type': 'application/xml',
        'Content-Disposition': 'attachment; filename="irrigation-petri-net.pnml"',
      },
    });
  } catch (error) {
    console.error('PNML export error:', error);
    return NextResponse.json(
      { error: 'Failed to export PNML' },
      { status: 500 }
    );
  }
}