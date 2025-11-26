// app/api/logs/route.ts

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || (session.user.role as string) !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const name = searchParams.get("name")
    const college = searchParams.get("college")
    const uid = searchParams.get("uid")
    
    // Build filter query
    const where: any = {}
    
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }
    
    if (name) {
      where.participant = {
        name: {
          contains: name,
          mode: 'insensitive'
        }
      }
    }
    
    if (college) {
      where.participant = {
        ...where.participant,
        college: {
          contains: college,
          mode: 'insensitive'
        }
      }
    }
    
    if (uid) {
      where.participant = {
        ...where.participant,
        user: {
          uid: uid
        }
      }
    }
    
    const participants = await prisma.participant.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            uid: true,
            role: true,
          }
        },
      },
      orderBy: { createdAt: "desc" },
    })
    
    return NextResponse.json({
      participants,
    })
  } catch (error) {
    console.error("Error fetching logs:", error)
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    )
  }
}