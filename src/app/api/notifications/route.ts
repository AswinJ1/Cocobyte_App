import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Fetch notifications for current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const userRole = session.user.role

    // Get user's site if they are a participant
    let userSite: string | null = null
    if (userRole === "PARTICIPANT") {
      const participant = await prisma.participant.findUnique({
        where: { userId: userId },
        select: { siteName: true }
      })
      userSite = participant?.siteName || null
    }

    // Get both personal and broadcast notifications
    const notifications = await prisma.notification.findMany({
      where: {
        AND: [
          {
            OR: [
              { userId: userId },
              { 
                userId: null, 
                targetRole: userRole,
                OR: [
                  { targetSite: null },
                  { targetSite: userSite }
                ]
              },
              { 
                userId: null, 
                targetRole: null,
                OR: [
                  { targetSite: null },
                  { targetSite: userSite }
                ]
              }
            ]
          },
          {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } }
            ]
          }
        ]
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        AND: [
          {
            OR: [
              { userId: userId },
              { 
                userId: null, 
                targetRole: userRole,
                OR: [
                  { targetSite: null },
                  { targetSite: userSite }
                ]
              },
              { 
                userId: null, 
                targetRole: null,
                OR: [
                  { targetSite: null },
                  { targetSite: userSite }
                ]
              }
            ]
          },
          { isRead: false },
          {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } }
            ]
          }
        ]
      }
    })

    return NextResponse.json({
      notifications,
      unreadCount,
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

// POST - Create notification (Admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await req.json()
    const {
      title,
      message,
      type = "INFO",
      priority = "NORMAL",
      targetRole,
      targetSite,
      userIds,
      isBroadcast = false,
      actionUrl,
      expiresAt
    } = body

    if (!title || !message) {
      return NextResponse.json(
        { error: "Title and message are required" },
        { status: 400 }
      )
    }

    // Create notification(s)
    if (isBroadcast) {
      // Broadcast notification (no specific user)
      const notification = await prisma.notification.create({
        data: {
          title,
          message,
          type,
          priority,
          targetRole: targetRole || null,
          targetSite: targetSite || null,
          createdBy: session.user.id,
          actionUrl: actionUrl || null,
          expiresAt: expiresAt ? new Date(expiresAt) : null
        }
      })

      return NextResponse.json({
        success: true,
        notification,
        message: "Broadcast notification created"
      })
    } else if (userIds && userIds.length > 0) {
      // Create notifications for specific users
      const notifications = await prisma.notification.createMany({
        data: userIds.map((userId: string) => ({
          userId,
          title,
          message,
          type,
          priority,
          targetSite: targetSite || null,
          createdBy: session.user.id,
          actionUrl: actionUrl || null,
          expiresAt: expiresAt ? new Date(expiresAt) : null
        }))
      })

      return NextResponse.json({
        success: true,
        count: notifications.count,
        message: `Created ${notifications.count} notifications`
      })
    } else {
      return NextResponse.json(
        { error: "Either specify userIds or set isBroadcast to true" },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Error creating notification:", error)
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    )
  }
}

// PATCH - Mark notification as read
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const notificationId = searchParams.get("id")
    const markAllRead = searchParams.get("markAllRead") === "true"

    if (markAllRead) {
      // Mark all notifications as read for current user
      await prisma.notification.updateMany({
        where: {
          OR: [
            { userId: session.user.id },
            { userId: null, targetRole: session.user.role as any },
            { userId: null, targetRole: null }
          ],
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        message: "All notifications marked as read"
      })
    }

    if (!notificationId) {
      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400 }
      )
    }

    // Mark specific notification as read
    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date()
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

// DELETE - Delete notification (Admin only)
export async function DELETE(req: NextRequest) {
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

    await prisma.notification.delete({
      where: { id: notificationId }
    })

    return NextResponse.json({
      success: true,
      message: "Notification deleted"
    })
  } catch (error) {
    console.error("Error deleting notification:", error)
    return NextResponse.json(
      { error: "Failed to delete notification" },
      { status: 500 }
    )
  }
}