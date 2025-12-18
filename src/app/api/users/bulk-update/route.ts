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

    // Validate required columns
    const requiredColumns = ["name", "email", "college", "siteName"]
    const headers = Object.keys(records[0])
    
    const headersLower = headers.map(h => h.toLowerCase())
    const missingColumns = requiredColumns.filter(col => !headersLower.includes(col.toLowerCase()))

    if (missingColumns.length > 0) {
      return NextResponse.json(
        { error: `Missing required columns: ${missingColumns.join(", ")}` },
        { status: 400 }
      )
    }

    // Create header mapping
    const headerMap: Record<string, string> = {}
    headers.forEach(h => {
      headerMap[h.toLowerCase()] = h
    })

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

    const presentUpdatableFields = updatableFields.filter(col => 
      headersLower.includes(col.toLowerCase())
    )

    if (presentUpdatableFields.length === 0) {
      return NextResponse.json(
        { error: "No updatable fields found. Updatable fields: " + updatableFields.join(", ") },
        { status: 400 }
      )
    }

    // Helper to get field value case-insensitively
    const getFieldValue = (record: Record<string, string>, fieldName: string): string => {
      const actualHeader = headerMap[fieldName.toLowerCase()]
      return actualHeader ? record[actualHeader]?.trim() || "" : ""
    }

    // STEP 1: Validate all rows first (no DB calls)
    const validRows: Array<{
      email: string
      name: string
      college: string
      siteName: string
      updateData: Record<string, string>
      updatedFields: string[]
      rowNumber: number
    }> = []

    const errors: Array<{ row: number; email: string; error: string }> = []

    for (let i = 0; i < records.length; i++) {
      const record = records[i]
      const rowNumber = i + 2

      const email = getFieldValue(record, "email").toLowerCase()
      const name = getFieldValue(record, "name")
      const college = getFieldValue(record, "college")
      const siteName = getFieldValue(record, "siteName")

      if (!email || !name || !college || !siteName) {
        errors.push({
          row: rowNumber,
          email: email || "N/A",
          error: "Missing required fields (name, email, college, siteName)",
        })
        continue
      }

      // Build update data
      const updateData: Record<string, string> = {}
      const updatedFields: string[] = []

      for (const field of presentUpdatableFields) {
        const value = getFieldValue(record, field)
        if (value && value !== "") {
          updateData[field] = value
          updatedFields.push(field)
        }
      }

      if (Object.keys(updateData).length === 0) {
        errors.push({
          row: rowNumber,
          email,
          error: "No fields to update (all fields empty)",
        })
        continue
      }

      validRows.push({
        email,
        name,
        college,
        siteName,
        updateData,
        updatedFields,
        rowNumber
      })
    }

    // STEP 2: Fetch ALL users+participants in ONE query
    const allEmails = validRows.map(r => r.email)
    const existingUsers = await prisma.user.findMany({
      where: {
        email: { in: allEmails }
      },
      include: {
        participant: true
      }
    })

    // Create email lookup map
    const userMap = new Map(
      existingUsers.map(u => [u.email, u])
    )

    // STEP 3: Verify all rows and prepare updates
    const updates: Array<{
      userId: string
      data: Record<string, string>
      email: string
      name: string
      updatedFields: string[]
    }> = []

    for (const row of validRows) {
      const user = userMap.get(row.email)

      if (!user) {
        errors.push({
          row: row.rowNumber,
          email: row.email,
          error: "User not found",
        })
        continue
      }

      if (!user.participant) {
        errors.push({
          row: row.rowNumber,
          email: row.email,
          error: "No participant profile",
        })
        continue
      }

      const p = user.participant

      // Verify details match
      const verificationErrors: string[] = []
      
      if (p.name.trim().toLowerCase() !== row.name.toLowerCase()) {
        verificationErrors.push(`Name mismatch: expected "${p.name}", got "${row.name}"`)
      }
      if (p.college.trim().toLowerCase() !== row.college.toLowerCase()) {
        verificationErrors.push(`College mismatch: expected "${p.college}", got "${row.college}"`)
      }
      if ((p.siteName || "").trim().toLowerCase() !== row.siteName.toLowerCase()) {
        verificationErrors.push(`Site mismatch: expected "${p.siteName || 'N/A'}", got "${row.siteName}"`)
      }

      if (verificationErrors.length > 0) {
        errors.push({
          row: row.rowNumber,
          email: row.email,
          error: verificationErrors.join("; "),
        })
        continue
      }

      updates.push({
        userId: user.id,
        data: row.updateData,
        email: row.email,
        name: row.name,
        updatedFields: row.updatedFields
      })
    }

    // STEP 4: Batch update using transaction (all updates in single round-trip)
    const updatedUsers: Array<{ email: string; name: string; updatedFields: string[] }> = []

    if (updates.length > 0) {
      try {
        // Use transaction to batch all updates (max 500 per transaction for safety)
        const CHUNK_SIZE = 500
        
        for (let i = 0; i < updates.length; i += CHUNK_SIZE) {
          const chunk = updates.slice(i, i + CHUNK_SIZE)
          
          await prisma.$transaction(
            chunk.map(({ userId, data }) =>
              prisma.participant.update({
                where: { userId },
                data
              })
            )
          )
        }

        // All succeeded
        updatedUsers.push(
          ...updates.map(u => ({
            email: u.email,
            name: u.name,
            updatedFields: u.updatedFields
          }))
        )
      } catch (error) {
        // If transaction fails, fall back to individual updates to get granular errors
        console.error("Batch update failed, trying individual updates:", error)
        
        for (const update of updates) {
          try {
            await prisma.participant.update({
              where: { userId: update.userId },
              data: update.data
            })

            updatedUsers.push({
              email: update.email,
              name: update.name,
              updatedFields: update.updatedFields
            })
          } catch (updateError) {
            errors.push({
              row: validRows.find(r => r.email === update.email)?.rowNumber || 0,
              email: update.email,
              error: updateError instanceof Error ? updateError.message : "Update failed"
            })
          }
        }
      }
    }

    const results = {
      updated: updatedUsers.length,
      failed: errors.length,
      errors,
      updatedUsers,
    }

    return NextResponse.json(results)
    
  } catch (error) {
    console.error("Bulk update error:", error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        updated: 0,
        failed: 0,
        errors: [],
        updatedUsers: []
      },
      { status: 500 }
    )
  }
}