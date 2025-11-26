
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const participantMembers = await prisma.participant.findMany({
      include: {
        user: {
          select: {
            email: true,
            uid: true,
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })
    
    const formattedparticipant = participantMembers.map(participant => ({
      id: participant.id,
      name: participant.name,
      college: participant.college,
      email: participant.user.email,
    }))
    
    return NextResponse.json(formattedparticipant)
  } catch (error) {
    console.error("Error fetching participant list:", error)
    return NextResponse.json(
      { error: "Failed to fetch participant list" },
      { status: 500 }
    )
  }
}