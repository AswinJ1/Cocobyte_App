import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { UAParser } from 'ua-parser-js'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || (session.user.role as string) !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const email = searchParams.get("email")
    const ipAddress = searchParams.get("ipAddress")
    const deviceType = searchParams.get("deviceType")
    const country = searchParams.get("country")

    // Build filter query
    const where: any = {}

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    if (email) {
      where.email = {
        contains: email,
        mode: 'insensitive'
      }
    }

    if (ipAddress) {
      where.ipAddress = {
        contains: ipAddress,
      }
    }

    if (deviceType) {
      where.deviceType = {
        contains: deviceType,
        mode: 'insensitive'
      }
    }

    if (country) {
      where.country = {
        contains: country,
        mode: 'insensitive'
      }
    }

    const loginLogs = await prisma.loginLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            uid: true,
            role: true,
            participant: {
              select: {
                name: true,
                hostelName: true,
                college: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 100
    })

    // Enrich data with location from ipapi.co
    const enrichedLogs = await Promise.all(
      loginLogs.map(async (log) => {
        const parser = new UAParser(log.userAgent)
        
        // Check if IP is localhost
        const isLocalhost = log.ipAddress === 'unknown' || 
                           log.ipAddress === '::1' || 
                           log.ipAddress === '127.0.0.1' ||
                           log.ipAddress.includes('localhost')
        
        // Get location from ipapi.co
        let locationData = { 
          city: log.city || (isLocalhost ? 'Localhost' : 'Unknown'), 
          region: log.region || (isLocalhost ? 'Development' : 'Unknown'), 
          country: log.country || (isLocalhost ? 'Local Machine' : 'Unknown') 
        }
        
        // Only fetch if not already stored and not localhost
        if (!isLocalhost && (!log.city || !log.country)) {
          try {
            const geoResponse = await fetch(`https://ipapi.co/${log.ipAddress}/json/`, {
              headers: {
                'User-Agent': 'Mozilla/5.0'
              },
              cache: 'no-store'
            })
            
            if (geoResponse.ok) {
              const geo = await geoResponse.json()
              
              if (!geo.error && geo.city) {
                locationData = {
                  city: geo.city || 'Unknown',
                  region: geo.region || 'Unknown',
                  country: geo.country_name || 'Unknown'
                }
                
                // Update the log with location data
                await prisma.loginLog.update({
                  where: { id: log.id },
                  data: {
                    city: locationData.city,
                    region: locationData.region,
                    country: locationData.country,
                    latitude: geo.latitude || null,
                    longitude: geo.longitude || null
                  }
                })
              }
            }
          } catch (geoError) {
            console.error(`Geo lookup failed for ${log.ipAddress}:`, geoError)
          }
        }

        return {
          id: log.id,
          timestamp: log.createdAt,
          activity: log.isSuccess ? 'Logged In' : 'Login Failed',
          user: log.user?.participant?.name || log.user?.email || log.email,
          email: log.user?.email || log.email,
          data: {
            IPAddress: log.ipAddress,
            userAgent: log.userAgent,
            device: log.deviceType || parser.getDevice().type || 'Desktop',
            os: log.os || parser.getOS().name || 'Unknown',
            browser: log.browser || parser.getBrowser().name || 'Unknown',
            city: locationData.city,
            region: locationData.region,
            country: locationData.country
          }
        }
      })
    )

    // Calculate stats
    const stats = {
      SUCCESS: loginLogs.filter(log => log.isSuccess).length,
      FAILED: loginLogs.filter(log => !log.isSuccess).length
    }

    return NextResponse.json({
      logs: enrichedLogs,
      stats
    })

  } catch (error) {
    console.error("Error fetching login logs:", error)
    return NextResponse.json(
      { error: "Failed to fetch login logs" },
      { status: 500 }
    )
  }
}