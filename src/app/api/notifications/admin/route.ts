import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Role } from "@prisma/client"

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
      ],
      take: 200 // Limit to last 200 notifications
    })

    return NextResponse.json({
      notifications,
      total: notifications.length
    })
  } catch (error) {
    console.error("Error fetching admin notifications:", error)
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
    const { title, message, type, priority, targetRole, actionUrl } = body

    if (!title || !message) {
      return NextResponse.json(
        { error: "Title and message are required" },
        { status: 400 }
      )
    }

    // Validate targetRole if provided
    const validTargetRole = targetRole && (targetRole === "ADMIN" || targetRole === "PARTICIPANT") 
      ? targetRole as Role 
      : null

    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        title,
        message,
        type,
        priority,
        targetRole: validTargetRole,
        actionUrl: actionUrl || null
      }
    })

    return NextResponse.json({
      success: true,
      notification,
      message: "Notification updated successfully"
    })
  } catch (error) {
    console.error("Error updating notification:", error)
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    )
  }
}