import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

interface CSVRow {
  name: string
  email: string
  college: string
  hostelName?: string
  roomNumber?: string
  wifiusername?: string
  wifiPassword?: string
  hostelLocation?: string
  contactNumber?: string
  gender?: string
}

// Generate random password
function generateRandomPassword(length: number = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// Generate unique UID with format ICPCAMRITA + 6 random digits
function generateUID(): string {
  const randomDigits = Math.floor(100000 + Math.random() * 900000) // Generates 6-digit number
  return `ICPCAMRITA${randomDigits}`
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

    // Read and parse CSV
    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV file is empty or invalid" },
        { status: 400 }
      )
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    
    // Validate required columns
    const requiredColumns = ['name', 'email', 'college']
    const missingColumns = requiredColumns.filter(col => !headers.includes(col))
    
    if (missingColumns.length > 0) {
      return NextResponse.json(
        { error: `Missing required columns: ${missingColumns.join(', ')}` },
        { status: 400 }
      )
    }

    // Parse rows
    const rows: CSVRow[] = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      const row: any = {}
      
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      
      rows.push(row as CSVRow)
    }

    // Import users
    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ row: number; email: string; error: string }>,
      users: [] as Array<{ email: string; password: string; name: string; uid: string }>
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNumber = i + 2 // +2 because of header and 0-index

      try {
        // Validate required fields
        if (!row.name || !row.email || !row.college) {
          throw new Error("Missing required fields")
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(row.email)) {
          throw new Error("Invalid email format")
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: row.email }
        })

        if (existingUser) {
          throw new Error("Email already exists")
        }

        // Generate random password
        const randomPassword = generateRandomPassword(12)
        const hashedPassword = await bcrypt.hash(randomPassword, 10)

        // Generate UID with format ICPCAMRITA + 6 random digits
        let uid = generateUID()
        
        // Ensure UID is unique
        let uidExists = await prisma.user.findUnique({ where: { uid } })
        while (uidExists) {
          uid = generateUID()
          uidExists = await prisma.user.findUnique({ where: { uid } })
        }

        // Create user
        await prisma.user.create({
          data: {
            email: row.email,
            password: hashedPassword,
            uid: uid,
            role: "PARTICIPANT",
            participant: {
              create: {
                name: row.name,
                college: row.college,
                gender: row.gender?.toLowerCase() || "male",
                hostelName: row.hostelName || "",
                roomNumber: row.roomNumber || "",
                wifiusername: row.wifiusername || "",
                wifiPassword: row.wifiPassword || "",
                hostelLocation: row.hostelLocation || "",
                contactNumber: row.contactNumber || "",
              }
            }
          }
        })

        results.success++
        results.users.push({
          email: row.email,
          password: randomPassword,
          name: row.name,
          uid: uid
        })
      } catch (error: any) {
        results.failed++
        results.errors.push({
          row: rowNumber,
          email: row.email || 'N/A',
          error: error.message || 'Unknown error'
        })
      }
    }

    return NextResponse.json(results, { status: 200 })
  } catch (error) {
    console.error("Error bulk importing users:", error)
    return NextResponse.json(
      { error: "Failed to import users" },
      { status: 500 }
    )
  }
}