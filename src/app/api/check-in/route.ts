import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch check-in status
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        participant: true,
      },
    });

    if (!user || !user.participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    const participant = user.participant;

    // Only return WiFi credentials if checked in
    const response = {
      isCheckedIn: participant.isCheckedIn || false,
      checkInTime: participant.checkInTime || null,
      wifiUsername: participant.isCheckedIn ? participant.wifiusername : null,
      wifiPassword: participant.isCheckedIn ? participant.wifiPassword : null,
      hostelName: participant.hostelName || null,
      roomNumber: participant.roomNumber || null,
      siteName: participant.siteName || null,
      participantName: participant.name || null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching check-in status:", error);
    return NextResponse.json(
      { error: "Failed to fetch check-in status" },
      { status: 500 }
    );
  }
}

// POST - Complete check-in
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        participant: true,
      },
    });

    if (!user || !user.participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    // Check if already checked in
    if (user.participant.isCheckedIn) {
      return NextResponse.json(
        { error: "Already checked in" },
        { status: 400 }
      );
    }

    // Update participant with check-in status
    const updatedParticipant = await prisma.participant.update({
      where: { id: user.participant.id },
      data: {
        isCheckedIn: true,
        checkInTime: new Date(),
      },
    });

    const response = {
      isCheckedIn: updatedParticipant.isCheckedIn,
      checkInTime: updatedParticipant.checkInTime,
      wifiUsername: updatedParticipant.wifiusername,
      wifiPassword: updatedParticipant.wifiPassword,
      hostelName: updatedParticipant.hostelName,
      roomNumber: updatedParticipant.roomNumber,
      siteName: updatedParticipant.siteName,
      participantName: updatedParticipant.name,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error during check-in:", error);
    return NextResponse.json(
      { error: "Failed to complete check-in" },
      { status: 500 }
    );
  }
}