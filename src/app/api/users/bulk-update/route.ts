import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { parse } from "csv-parse/sync"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    const fileContent = await file.text()
    
    let records: Record<string, string>[]
    try {
      records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      })
    } catch {
      return NextResponse.json(
        { error: "Invalid CSV format" },
        { status: 400 }
      )
    }

    if (records.length === 0) {
      return NextResponse.json(
        { error: "CSV file is empty" },
        { status: 400 }
      )
    }

    // Validate required columns for verification
    const requiredColumns = ["name", "email", "college", "siteName"]
    const headers = Object.keys(records[0])
    
    // Normalize headers to lowercase for comparison
    const headersLower = headers.map(h => h.toLowerCase())
    const missingColumns = requiredColumns.filter(col => !headersLower.includes(col.toLowerCase()))

    if (missingColumns.length > 0) {
      return NextResponse.json(
        { error: `Missing required columns for verification: ${missingColumns.join(", ")}` },
        { status: 400 }
      )
    }

    // Create a mapping from lowercase to actual header names
    const headerMap: Record<string, string> = {}
    headers.forEach(h => {
      headerMap[h.toLowerCase()] = h
    })

    // Updatable fields (these are in the Participant model)
    const updatableFields = [
      "teamName",
      "hostelName",
      "roomNumber",
      "wifiusername",
      "wifiPassword",
      "hostelLocation",
      "contactNumber",
      "gender"
    ]

    // Check which updatable fields are present in the CSV (case-insensitive)
    const presentUpdatableFields = updatableFields.filter(col => 
      headersLower.includes(col.toLowerCase())
    )

    if (presentUpdatableFields.length === 0) {
      return NextResponse.json(
        { error: "No updatable fields found in CSV. Updatable fields are: " + updatableFields.join(", ") },
        { status: 400 }
      )
    }

    const results = {
      updated: 0,
      failed: 0,
      errors: [] as Array<{ row: number; email: string; error: string }>,
      updatedUsers: [] as Array<{ 
        email: string; 
        name: string; 
        updatedFields: string[] 
      }>,
    }

    for (let i = 0; i < records.length; i++) {
      const record = records[i]
      const rowNumber = i + 2 // Account for header row and 0-index

      // Get values using case-insensitive header matching
      const getFieldValue = (fieldName: string): string => {
        const actualHeader = headerMap[fieldName.toLowerCase()]
        return actualHeader ? record[actualHeader]?.trim() || "" : ""
      }

      const email = getFieldValue("email").toLowerCase()
      const name = getFieldValue("name")
      const college = getFieldValue("college")
      const siteName = getFieldValue("siteName")

      // Validate required fields
      if (!email || !name || !college || !siteName) {
        results.failed++
        results.errors.push({
          row: rowNumber,
          email: email || "N/A",
          error: "Missing required verification fields (name, email, college, siteName)",
        })
        continue
      }

      try {
        // Find the existing user WITH participant data
        const existingUser = await prisma.user.findUnique({
          where: { email },
          include: {
            participant: true
          }
        })

        if (!existingUser) {
          results.failed++
          results.errors.push({
            row: rowNumber,
            email,
            error: "User not found with this email",
          })
          continue
        }

        // Check if participant exists
        if (!existingUser.participant) {
          results.failed++
          results.errors.push({
            row: rowNumber,
            email,
            error: "User exists but has no participant profile",
          })
          continue
        }

        const participant = existingUser.participant

        // Verify user details match (case-insensitive comparison with null checks)
        const verificationErrors: string[] = []

        const existingName = participant.name?.trim().toLowerCase() || ""
        const existingCollege = participant.college?.trim().toLowerCase() || ""
        const existingSiteName = participant.siteName?.trim().toLowerCase() || ""

        if (existingName !== name.toLowerCase()) {
          verificationErrors.push(`Name mismatch: expected "${participant.name || 'N/A'}", got "${name}"`)
        }

        if (existingCollege !== college.toLowerCase()) {
          verificationErrors.push(`College mismatch: expected "${participant.college || 'N/A'}", got "${college}"`)
        }

        if (existingSiteName !== siteName.toLowerCase()) {
          verificationErrors.push(`Site name mismatch: expected "${participant.siteName || 'N/A'}", got "${siteName}"`)
        }

        if (verificationErrors.length > 0) {
          results.failed++
          results.errors.push({
            row: rowNumber,
            email,
            error: verificationErrors.join("; "),
          })
          continue
        }

        // Build update data with only present fields
        const updateData: Record<string, string> = {}
        const updatedFields: string[] = []

        for (const field of presentUpdatableFields) {
          const value = getFieldValue(field)
          if (value && value !== "") {
            updateData[field] = value
            updatedFields.push(field)
          }
        }

        if (Object.keys(updateData).length === 0) {
          results.failed++
          results.errors.push({
            row: rowNumber,
            email,
            error: "No fields to update (all update fields are empty)",
          })
          continue
        }

        // Update the participant (not the user)
        await prisma.participant.update({
          where: { userId: existingUser.id },
          data: updateData,
        })

        results.updated++
        results.updatedUsers.push({
          email,
          name,
          updatedFields,
        })

      } catch (error) {
        console.error(`Error updating user ${email}:`, error)
        results.failed++
        results.errors.push({
          row: rowNumber,
          email,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        })
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("Bulk update error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}