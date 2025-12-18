// app/api/admin/arrival-details/[identifier]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: { identifier: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const identifier = params.identifier

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