import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Fetch carpool interests for the current user
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
          include: {
            // Interests received (people interested in my arrival)
            carpoolInterestsReceived: {
              include: {
                interestedParticipant: {
                  select: {
                    id: true,
                    name: true,
                    college: true,
                    teamName: true,
                    avatarUrl: true,
                    gender: true,
                  }
                }
              },
              orderBy: { createdAt: 'desc' }
            },
            // Interests sent (arrivals I'm interested in)
            carpoolInterestsSent: {
              select: {
                arrivalOwnerId: true,
              }
            }
          }
        }
      }
    })

    if (!user?.participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 })
    }

    return NextResponse.json({
      received: user.participant.carpoolInterestsReceived,
      sentToIds: user.participant.carpoolInterestsSent.map(i => i.arrivalOwnerId),
    })
  } catch (error) {
    console.error("Error fetching carpool interests:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Express interest in someone's carpool
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { arrivalOwnerId, contactNumber, message } = body

    if (!arrivalOwnerId) {
      return NextResponse.json({ error: "Arrival owner ID is required" }, { status: 400 })
    }

    if (!contactNumber || contactNumber.trim().length < 10) {
      return NextResponse.json({ error: "Valid contact number is required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { participant: true }
    })

    if (!user?.participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 })
    }

    // Can't express interest in your own arrival
    if (user.participant.id === arrivalOwnerId) {
      return NextResponse.json({ error: "Cannot express interest in your own arrival" }, { status: 400 })
    }

    // Check if arrival owner exists and has submitted arrival details
    const arrivalOwner = await prisma.participant.findUnique({
      where: { id: arrivalOwnerId }
    })

    if (!arrivalOwner || !arrivalOwner.arrivalDetailsSubmitted) {
      return NextResponse.json({ error: "Invalid arrival" }, { status: 404 })
    }

    // Check if already expressed interest
    const existingInterest = await prisma.carpoolInterest.findUnique({
      where: {
        arrivalOwnerId_interestedParticipantId: {
          arrivalOwnerId,
          interestedParticipantId: user.participant.id,
        }
      }
    })

    if (existingInterest) {
      return NextResponse.json({ error: "You have already expressed interest" }, { status: 400 })
    }

    // Create carpool interest
    const interest = await prisma.carpoolInterest.create({
      data: {
        arrivalOwnerId,
        interestedParticipantId: user.participant.id,
        contactNumber: contactNumber.trim(),
        message: message?.trim() || null,
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: "Interest expressed successfully",
      data: interest 
    })
  } catch (error) {
    console.error("Error creating carpool interest:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Remove interest
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const arrivalOwnerId = searchParams.get("arrivalOwnerId")

    if (!arrivalOwnerId) {
      return NextResponse.json({ error: "Arrival owner ID is required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { participant: true }
    })

    if (!user?.participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 })
    }

    await prisma.carpoolInterest.deleteMany({
      where: {
        arrivalOwnerId,
        interestedParticipantId: user.participant.id,
      }
    })

    return NextResponse.json({ success: true, message: "Interest removed" })
  } catch (error) {
    console.error("Error removing carpool interest:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 