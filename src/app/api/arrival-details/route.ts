import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { TransportMode } from "@prisma/client"

// GET - Fetch arrival details
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        participant: {
          select: {
            transportMode: true,
            arrivalFrom: true,
            arrivalTo: true,
            expectedArrivalTime: true,
            interestedInCarpool: true,
            arrivalDetailsSubmitted: true,
          }
        }
      }
    })

    if (!user?.participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 })
    }

    // Return with defaults for null values
    return NextResponse.json({
      transportMode: user.participant.transportMode,
      arrivalFrom: user.participant.arrivalFrom,
      arrivalTo: user.participant.arrivalTo,
      expectedArrivalTime: user.participant.expectedArrivalTime,
      interestedInCarpool: user.participant.interestedInCarpool ?? false,
      arrivalDetailsSubmitted: user.participant.arrivalDetailsSubmitted ?? false,
    })
  } catch (error) {
    console.error("Error fetching arrival details:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Valid transport modes mapping
const TRANSPORT_MODE_MAP: Record<string, TransportMode> = {
  "flight": TransportMode.FLIGHT,
  "train": TransportMode.TRAIN,
  "bus": TransportMode.BUS,
  "other": TransportMode.OTHER,
}

// POST - Save arrival details
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { transportMode, arrivalFrom, arrivalTo, expectedArrivalTime, interestedInCarpool } = body

    if (!transportMode) {
      return NextResponse.json({ error: "Transport mode is required" }, { status: 400 })
    }

    // Validate and convert transport mode to enum
    const transportModeEnum = TRANSPORT_MODE_MAP[transportMode.toLowerCase()]
    if (!transportModeEnum) {
      return NextResponse.json({ 
        error: "Invalid transport mode. Must be one of: flight, train, bus, other" 
      }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { participant: true }
    })

    if (!user?.participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 })
    }

    // Build update data
    const updateData: {
      transportMode: TransportMode
      arrivalDetailsSubmitted: boolean
      arrivalFrom: string | null
      arrivalTo: string | null
      expectedArrivalTime: Date | null
      interestedInCarpool: boolean
    } = {
      transportMode: transportModeEnum,
      arrivalDetailsSubmitted: true,
      arrivalFrom: null,
      arrivalTo: null,
      expectedArrivalTime: null,
      interestedInCarpool: false,
    }

    // Only save additional fields if not "other" mode
    if (transportModeEnum !== TransportMode.OTHER) {
      updateData.arrivalFrom = arrivalFrom?.trim() || null
      updateData.arrivalTo = arrivalTo?.trim() || null
      updateData.expectedArrivalTime = expectedArrivalTime ? new Date(expectedArrivalTime) : null
      updateData.interestedInCarpool = interestedInCarpool ?? false
    }

    const updatedParticipant = await prisma.participant.update({
      where: { userId: user.id },
      data: updateData,
    })

    return NextResponse.json({ 
      success: true, 
      message: "Arrival details saved successfully",
      data: updatedParticipant 
    })
  } catch (error) {
    console.error("Error saving arrival details:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}