// app/api/admin/arrival-details/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Admin fetches all participants' arrival details
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Admin authorization check
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(req.url)
    const transportMode = searchParams.get("transportMode")
    const siteName = searchParams.get("siteName")
    const interestedInCarpool = searchParams.get("interestedInCarpool")
    const submitted = searchParams.get("submitted")

    // Build filter conditions
    const where: any = {}

    if (transportMode) {
      where.transportMode = transportMode.toUpperCase()
    }

    if (siteName) {
      where.siteName = siteName
    }

    if (interestedInCarpool === "true") {
      where.interestedInCarpool = true
    }

    if (submitted === "true") {
      where.arrivalDetailsSubmitted = true
    } else if (submitted === "false") {
      where.arrivalDetailsSubmitted = false
    }

    // Fetch all participants with arrival details
    const participants = await prisma.participant.findMany({
      where,
      select: {
        id: true,
        name: true,
        college: true,
        siteName: true,
        teamName: true,
        contactNumber: true,
        transportMode: true,
        arrivalFrom: true,
        arrivalTo: true,
        expectedArrivalTime: true,
        interestedInCarpool: true,
        arrivalDetailsSubmitted: true,
        carpoolContactNumber: true,
        user: {
          select: {
            email: true,
            uid: true,
          }
        }
      },
      orderBy: [
        { expectedArrivalTime: 'asc' },
        { name: 'asc' }
      ]
    })

    // Group by transport mode for summary
    const summary = {
      total: participants.length,
      submitted: participants.filter(p => p.arrivalDetailsSubmitted).length,
      byTransportMode: {
        FLIGHT: participants.filter(p => p.transportMode === 'FLIGHT').length,
        TRAIN: participants.filter(p => p.transportMode === 'TRAIN').length,
        BUS: participants.filter(p => p.transportMode === 'BUS').length,
        OTHER: participants.filter(p => p.transportMode === 'OTHER').length,
      },
      interestedInCarpool: participants.filter(p => p.interestedInCarpool).length,
      bySite: {} as Record<string, number>
    }

    // Group by site
    participants.forEach(p => {
      const site = p.siteName || 'Unknown'
      summary.bySite[site] = (summary.bySite[site] || 0) + 1
    })

    return NextResponse.json({
      success: true,
      data: participants,
      summary
    })

  } catch (error) {
    console.error("Error fetching arrival details:", error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        ...(process.env.NODE_ENV === 'development' && { 
          details: error instanceof Error ? error.message : 'Unknown error'
        })
      },
      { status: 500 }
    )
  }
}

// GET single participant's details by ID or email
// app/api/admin/arrival-details/[identifier]/route.ts
export async function GETSingle(
  req: NextRequest,
  { params }: { params: { identifier: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { identifier } = params

    // Try to find by email or UID
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { uid: identifier }
        ]
      },
      include: {
        participant: {
          select: {
            id: true,
            name: true,
            college: true,
            siteName: true,
            teamName: true,
            hostelName: true,
            roomNumber: true,
            contactNumber: true,
            gender: true,
            transportMode: true,
            arrivalFrom: true,
            arrivalTo: true,
            expectedArrivalTime: true,
            interestedInCarpool: true,
            arrivalDetailsSubmitted: true,
            carpoolContactNumber: true,
            isCheckedIn: true,
            checkInTime: true,
          }
        }
      }
    })

    if (!user?.participant) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        email: user.email,
        uid: user.uid,
        ...user.participant
      }
    })

  } catch (error) {
    console.error("Error fetching participant details:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT - Admin updates participant's arrival details
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { 
      participantId, 
      transportMode, 
      arrivalFrom, 
      arrivalTo, 
      expectedArrivalTime,
      interestedInCarpool,
      carpoolContactNumber 
    } = body

    if (!participantId) {
      return NextResponse.json(
        { error: "Participant ID is required" },
        { status: 400 }
      )
    }

    // Build update data
    const updateData: any = {}

    if (transportMode) {
      updateData.transportMode = transportMode.toUpperCase()
    }
    if (arrivalFrom !== undefined) {
      updateData.arrivalFrom = arrivalFrom?.trim() || null
    }
    if (arrivalTo !== undefined) {
      updateData.arrivalTo = arrivalTo?.trim() || null
    }
    if (expectedArrivalTime !== undefined) {
      updateData.expectedArrivalTime = expectedArrivalTime ? new Date(expectedArrivalTime) : null
    }
    if (interestedInCarpool !== undefined) {
      updateData.interestedInCarpool = interestedInCarpool
    }
    if (carpoolContactNumber !== undefined) {
      updateData.carpoolContactNumber = carpoolContactNumber?.trim() || null
    }

    const updatedParticipant = await prisma.participant.update({
      where: { id: participantId },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      message: "Arrival details updated successfully",
      data: updatedParticipant
    })

  } catch (error) {
    console.error("Error updating arrival details:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Admin clears participant's arrival details
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const participantId = searchParams.get("participantId")

    if (!participantId) {
      return NextResponse.json(
        { error: "Participant ID is required" },
        { status: 400 }
      )
    }

    // Clear arrival details
    await prisma.participant.update({
      where: { id: participantId },
      data: {
        transportMode: null,
        arrivalFrom: null,
        arrivalTo: null,
        expectedArrivalTime: null,
        interestedInCarpool: false,
        arrivalDetailsSubmitted: false,
        carpoolContactNumber: null,
      }
    })

    return NextResponse.json({
      success: true,
      message: "Arrival details cleared successfully"
    })

  } catch (error) {
    console.error("Error clearing arrival details:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}