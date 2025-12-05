import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Fetch all notifications (Admin only)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const notifications = await prisma.notification.findMany({
      orderBy: [
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({
      notifications,
      total: notifications.length
    })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    )
  }
}

// PATCH - Update notification (Admin only)
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const notificationId = searchParams.get("id")

    if (!notificationId) {
      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400 }
      )
    }

    const body = await req.json()
    const {
      title,
      message,
      type,
      priority,
      targetRole,
      targetSite,
      actionUrl
    } = body

    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        title,
        message,
        type,
        priority,
        targetRole,
        targetSite,
        actionUrl
      }
    })

    return NextResponse.json({
      success: true,
      notification
    })
  } catch (error) {
    console.error("Error updating notification:", error)
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    )
  }
}