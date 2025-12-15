import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current user's site
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        participant: {
          select: {
            siteName: true,
          }
        }
      }
    })

    if (!currentUser?.participant?.siteName) {
      return NextResponse.json({ error: "Site not assigned" }, { status: 400 })
    }

    const userSiteName = currentUser.participant.siteName

    // Fetch all participants from the same site who have submitted arrival details
    const siteArrivals = await prisma.participant.findMany({
      where: {
        siteName: userSiteName,
        arrivalDetailsSubmitted: true,
      },
      select: {
        id: true,
        name: true,
        college: true,
        teamName: true,
        transportMode: true,
        arrivalFrom: true,
        arrivalTo: true,
        expectedArrivalTime: true,
        interestedInCarpool: true,
        gender: true,
        avatarUrl: true,
        contactNumber: true,
        userId: true,
      },
      orderBy: {
        expectedArrivalTime: 'asc'
      }
    })

    // Get stats
    const stats = {
      total: siteArrivals.length,
      byTransportMode: {
        flight: siteArrivals.filter(p => p.transportMode === 'FLIGHT').length,
        train: siteArrivals.filter(p => p.transportMode === 'TRAIN').length,
        bus: siteArrivals.filter(p => p.transportMode === 'BUS').length,
        other: siteArrivals.filter(p => p.transportMode === 'OTHER').length,
      },
      interestedInCarpool: siteArrivals.filter(p => p.interestedInCarpool).length,
    }

    // Get total participants count for the site
    const totalParticipants = await prisma.participant.count({
      where: { siteName: userSiteName }
    })

    return NextResponse.json({
      siteName: userSiteName,
      arrivals: siteArrivals,
      stats: {
        ...stats,
        totalParticipants,
        submissionRate: totalParticipants > 0 
          ? Math.round((stats.total / totalParticipants) * 100) 
          : 0
      },
      currentUserId: currentUser.id
    })
  } catch (error) {
    console.error("Error fetching site arrivals:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}