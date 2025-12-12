import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all participants with their check-in data
    const participants = await prisma.participant.findMany({
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
      orderBy: [
        { isCheckedIn: "desc" },
        { checkInTime: "desc" },
        { name: "asc" },
      ],
    });

    // Format check-in records
    const checkIns = participants.map((p) => ({
      id: p.id,
      name: p.name,
      email: p.user?.email || "",
      college: p.college,
      siteName: p.siteName || "Unassigned",
      hostelName: p.hostelName || "",
      roomNumber: p.roomNumber || "",
      isCheckedIn: p.isCheckedIn || false,
      checkInTime: p.checkInTime?.toISOString() || null,
      contactNumber: p.contactNumber || "",
    }));

    // Calculate statistics
    const total = checkIns.length;
    const checkedIn = checkIns.filter((c) => c.isCheckedIn).length;
    const pending = total - checkedIn;

    // Site-wise stats
    const bySite: Record<string, { total: number; checkedIn: number }> = {};
    const sites = ["Amritapuri", "Mysuru", "Coimbatore", "Bangalore"];

    sites.forEach((site) => {
      const siteRecords = checkIns.filter((c) => c.siteName === site);
      bySite[site] = {
        total: siteRecords.length,
        checkedIn: siteRecords.filter((c) => c.isCheckedIn).length,
      };
    });

    return NextResponse.json({
      checkIns,
      stats: {
        total,
        checkedIn,
        pending,
        bySite,
      },
    });
  } catch (error) {
    console.error("Error fetching check-ins:", error);
    return NextResponse.json(
      { error: "Failed to fetch check-in data" },
      { status: 500 }
    );
  }
}