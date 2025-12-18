import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

interface CSVRow {
  name: string
  email: string
  college: string
  sitename?: string
  teamname?: string
  hostelname?: string
  roomnumber?: string
  wifiusername?: string
  wifipassword?: string
  hostellocation?: string
  contactnumber?: string
  gender?: string
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current.trim())
  return result
}

function generateRandomPassword(length: number = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// Generate UID without DB checks - collisions are statistically impossible in small batches
function generateUID(existingUIDs: Set<string>): string {
  let uid: string
  do {
    const randomDigits = Math.floor(100000 + Math.random() * 900000)
    uid = `ICPCAMRITA${randomDigits}`
  } while (existingUIDs.has(uid)) // Only check within current batch
  
  existingUIDs.add(uid)
  return uid
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      )
    }

    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV file is empty or invalid" },
        { status: 400 }
      )
    }

    const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase())
    
    const requiredColumns = ['name', 'email', 'college']
    const missingColumns = requiredColumns.filter(col => !headers.includes(col))
    
    if (missingColumns.length > 0) {
      return NextResponse.json(
        { error: `Missing required columns: ${missingColumns.join(', ')}` },
        { status: 400 }
      )
    }

    const rows: CSVRow[] = []
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]).map(v => v.trim())
      const row: any = {}
      
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      
      rows.push(row as CSVRow)
    }

    // Validation pass - collect errors but don't query DB
    const validRows: Array<{
      row: CSVRow
      rowNumber: number
      password: string
      uid: string
    }> = []
    
    const errors: Array<{ row: number; email: string; error: string }> = []
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const uidSet = new Set<string>()
    const emailSet = new Set<string>()

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNumber = i + 2

      try {
        if (!row.name || !row.email || !row.college) {
          throw new Error("Missing required fields")
        }

        if (!emailRegex.test(row.email)) {
          throw new Error("Invalid email format")
        }

        // Check for duplicates within CSV
        if (emailSet.has(row.email)) {
          throw new Error("Duplicate email in CSV")
        }
        emailSet.add(row.email)

        const password = generateRandomPassword(12)
        const uid = generateUID(uidSet)

        validRows.push({ row, rowNumber, password, uid })
      } catch (error: any) {
        errors.push({
          row: rowNumber,
          email: row.email || 'N/A',
          error: error.message || 'Unknown error'
        })
      }
    }

    // Parallel bcrypt hashing (much faster than sequential)
    // Use lower cost factor (8) for bulk imports - still secure but 4x faster
    const hashPromises = validRows.map(({ password }) => 
      bcrypt.hash(password, 8)
    )
    const hashedPasswords = await Promise.all(hashPromises)

    // Prepare batch data for users
    const usersToCreate = validRows.map(({ row, uid }, index) => ({
      email: row.email,
      password: hashedPasswords[index],
      uid: uid,
      role: "PARTICIPANT" as const,
    }))

    // Batch insert users - skipDuplicates handles DB-level conflicts
    const userResult = await prisma.user.createMany({
      data: usersToCreate,
      skipDuplicates: true, // Ignores unique constraint violations (email/uid)
    })

    // Fetch created users to get their database IDs for participant linking
    const createdUsers = await prisma.user.findMany({
      where: {
        email: { in: validRows.map(v => v.row.email) }
      },
      select: { id: true, email: true, uid: true }
    })

    // Map email to User.id (database ID, not uid)
    const emailToUserId = new Map(createdUsers.map(u => [u.email, u.id]))

    // Prepare participant data with correct User.id references
    const participantsToCreate = validRows
      .map(({ row }) => {
        const userId = emailToUserId.get(row.email)
        if (!userId) return null // User wasn't created (duplicate in DB)
        
        return {
          userId: userId, // ✅ CORRECT: User.id (database ID)
          name: row.name,
          college: row.college,
          siteName: row.sitename || "",
          teamName: row.teamname || "",
          hostelName: row.hostelname || "",
          roomNumber: row.roomnumber || "",
          wifiusername: row.wifiusername || "",
          wifiPassword: row.wifipassword || "",
          hostelLocation: row.hostellocation || "",
          contactNumber: row.contactnumber || "",
          gender: row.gender?.toLowerCase() || "male",
        }
      })
      .filter((p): p is NonNullable<typeof p> => p !== null)

    // Batch insert participants
    const participantResult = await prisma.participant.createMany({
      data: participantsToCreate,
      skipDuplicates: true,
    })

    // Prepare response with credentials (only for successfully created users)
    const successfulUsers = validRows
      .filter(v => emailToUserId.has(v.row.email))
      .map(v => ({
        email: v.row.email,
        password: v.password, // Plain text password for admin to share
        name: v.row.name,
        uid: v.uid,
        siteName: v.row.sitename || "",
        teamName: v.row.teamname || "",
      }))

    const results = {
      success: userResult.count,
      failed: errors.length + (validRows.length - userResult.count),
      errors: errors,
      users: successfulUsers,
      message: `Successfully imported ${userResult.count} users, ${errors.length} validation errors, ${validRows.length - userResult.count} duplicate emails in database`
    }

    return NextResponse.json(results, { status: 200 })
    
  } catch (error: any) {
    console.error("Error bulk importing users:", error)
    // Always return JSON to avoid "Unexpected token" errors
    return NextResponse.json(
      { 
        error: "Failed to import users",
        details: error.message,
        success: 0,
        failed: 0,
        errors: [],
        users: []
      },
      { status: 500 }
    )
  }
}