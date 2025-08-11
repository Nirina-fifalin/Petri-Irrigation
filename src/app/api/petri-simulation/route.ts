import { NextResponse } from 'next/server'
import { getInitialMarking, applyTransition } from '../../../utils/petri-net-engine'
import { PetriMarking, TransitionName } from '../../../types/petri-net'

export async function GET() {
  try {
    const marking = getInitialMarking()
    return NextResponse.json({ marking })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: 'Failed to get initial marking' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const { transition } = await req.json()
    
    if (!transition) {
      return NextResponse.json(
        { ok: false, error: 'Transition is required' },
        { status: 400 }
      )
    }

    const result = applyTransition(transition as TransitionName)
    return NextResponse.json({ ok: true, marking: result })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 400 }
    )
  }
}