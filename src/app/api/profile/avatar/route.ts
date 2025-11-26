import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      console.log("❌ Unauthorized: No session or email")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("✅ Session found for:", session.user.email)

    const body = await request.json()
    const { avatarUrl, gender } = body

    console.log("📦 Request body:", { avatarUrl, gender })

    if (!avatarUrl) {
      console.log("❌ No avatar URL provided")
      return NextResponse.json({ error: "Avatar URL is required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { 

        participant: true,
        admin: true,
      },
    })

    if (!user) {
      console.log("❌ User not found in database")
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("✅ User found:", {
      id: user.id,
      email: user.email,
      role: user.role,
      hasparticipant: !!user.participant,
      hasAdmin: !!user.admin,
    })

    let updatedProfile: any = null

    // Update based on user ROLE (not just which records exist)
    // This is important because a user might have multiple records
    // (e.g., student who became team lead)
    switch (user.role) {
    

      case "PARTICIPANT":
        if (!user.participant) {
          console.log("❌ participant record not found")
          return NextResponse.json({ error: "participant profile not found" }, { status: 404 })
        }
        console.log("🔄 Updating participant profile...")
        updatedProfile = await prisma.participant.update({
          where: { userId: user.id },
          data: {
            avatarUrl,
            ...(gender && { gender }),
          },
        })
        console.log("✅ participant profile updated")
        break


      case "ADMIN":
        if (!user.admin) {
          console.log("❌ Admin record not found")
          return NextResponse.json({ error: "Admin profile not found" }, { status: 404 })
        }
        console.log("🔄 Updating admin profile...")
        updatedProfile = await prisma.admin.update({
          where: { userId: user.id },
          data: {
            avatarUrl,
            ...(gender && { gender }),
          },
        })
        console.log("✅ Admin profile updated")
        break

      default:
        console.log("❌ Unknown role:", user.role)
        return NextResponse.json({ error: "Invalid user role" }, { status: 400 })
    }

    console.log("✅ Returning success response")
    return NextResponse.json({ 
      success: true, 
      avatarUrl: updatedProfile?.avatarUrl || avatarUrl, 
      gender: updatedProfile?.gender || gender 
    })
  } catch (error) {
    console.error("❌ Error updating avatar:", error)
    
    // Log more detailed error info
    if (error instanceof Error) {
      console.error("Error name:", error.name)
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }
    
    return NextResponse.json(
      { 
        error: "Failed to update avatar",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}