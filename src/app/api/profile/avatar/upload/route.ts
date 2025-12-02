import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { uploadToS3, deleteFromS3 } from "@/lib/s3-upload"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const gender = formData.get("gender") as "male" | "female"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, and WebP are allowed" },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        participant: true,
        admin: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Upload to S3
    const avatarUrl = await uploadToS3(file, user.id)

    // Delete old avatar if it exists and is from S3
    let oldAvatarUrl: string | null = null
    if (user.role === "PARTICIPANT" && user.participant?.avatarUrl) {
      oldAvatarUrl = user.participant.avatarUrl
    } else if (user.role === "ADMIN" && user.admin?.avatarUrl) {
      oldAvatarUrl = user.admin.avatarUrl
    }

    if (oldAvatarUrl && oldAvatarUrl.includes(process.env.SUPABASE_S3_BUCKET || "")) {
      await deleteFromS3(oldAvatarUrl)
    }

    // Update database
    let updatedProfile: any = null

    switch (user.role) {
      case "PARTICIPANT":
        if (!user.participant) {
          return NextResponse.json({ error: "Participant profile not found" }, { status: 404 })
        }
        updatedProfile = await prisma.participant.update({
          where: { userId: user.id },
          data: {
            avatarUrl,
            ...(gender && { gender }),
          },
        })
        break

      case "ADMIN":
        if (!user.admin) {
          return NextResponse.json({ error: "Admin profile not found" }, { status: 404 })
        }
        updatedProfile = await prisma.admin.update({
          where: { userId: user.id },
          data: {
            avatarUrl,
            ...(gender && { gender }),
          },
        })
        break

      default:
        return NextResponse.json({ error: "Invalid user role" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      avatarUrl: updatedProfile?.avatarUrl || avatarUrl,
      gender: updatedProfile?.gender || gender,
    })
  } catch (error) {
    console.error("Error uploading avatar:", error)
    return NextResponse.json(
      {
        error: "Failed to upload avatar",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// Increase max body size for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
}