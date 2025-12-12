"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/dashboard-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

interface CheckInData {
  isCheckedIn: boolean;
  checkInTime: string | null;
  wifiUsername: string | null;
  wifiPassword: string | null;
  hostelName: string | null;
  roomNumber: string | null;
  siteName: string | null;
  participantName: string | null;
}

export default function CheckInPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkInData, setCheckInData] = useState<CheckInData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!session || (session.user.role as string) !== "PARTICIPANT") {
      router.push("/");
      return;
    }
    fetchCheckInStatus();
  }, [session, router]);

  const fetchCheckInStatus = async () => {
    try {
      const response = await fetch("/api/check-in");
      if (response.ok) {
        const data = await response.json();
        setCheckInData(data);
      } else {
        setError("Failed to load check-in status");
      }
    } catch (error) {
      console.error("Error fetching check-in status:", error);
      setError("Error loading check-in status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/check-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCheckInData(data);
        setSuccess("Check-in completed successfully! Your WiFi credentials are now available.");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to complete check-in");
      }
    } catch (error) {
      console.error("Error during check-in:", error);
      setError("An error occurred during check-in");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-4">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-8 w-96" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hostel Check-In</h1>
          <p className="text-muted-foreground mt-1">
            Complete your check-in to receive your WiFi credentials
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
            <AlertDescription className="text-green-800 dark:text-green-400">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* Check-In Status Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Check-In Status</CardTitle>
                <CardDescription>
                  {checkInData?.isCheckedIn
                    ? "You have successfully checked in"
                    : "Please complete your hostel check-in"}
                </CardDescription>
              </div>
              <Badge
                variant={checkInData?.isCheckedIn ? "default" : "secondary"}
                className={
                  checkInData?.isCheckedIn
                    ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                    : "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
                }
              >
                {checkInData?.isCheckedIn ? "Checked In" : "Pending"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Participant Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground mb-1">Name</p>
                <p className="font-semibold">{checkInData?.participantName || "N/A"}</p>
              </div>
              <div className="p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground mb-1">Site</p>
                <p className="font-semibold">{checkInData?.siteName || "N/A"}</p>
              </div>
              <div className="p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground mb-1">Hostel</p>
                <p className="font-semibold">{checkInData?.hostelName || "N/A"}</p>
              </div>
              <div className="p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground mb-1">Room Number</p>
                <p className="font-semibold">{checkInData?.roomNumber || "N/A"}</p>
              </div>
            </div>

            {/* Check-In Time */}
            {checkInData?.isCheckedIn && checkInData?.checkInTime && (
              <div className="p-4 rounded-lg border bg-muted/50">
                <p className="text-sm text-muted-foreground mb-1">Checked In At</p>
                <p className="font-semibold">{formatDateTime(checkInData.checkInTime)}</p>
              </div>
            )}

            {/* Check-In Button */}
            {!checkInData?.isCheckedIn && (
              <div className="pt-4">
                <Button
                  onClick={handleCheckIn}
                  disabled={isSubmitting}
                  size="lg"
                  className="w-full md:w-auto"
                >
                  {isSubmitting ? "Processing..." : "Complete Check-In"}
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  By clicking this button, you confirm that you have arrived at your assigned hostel.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* WiFi Credentials Card - Only shown after check-in */}
        {checkInData?.isCheckedIn ? (
          <Card className="shadow-lg border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <span className="text-xl">📶</span>
                </div>
                WiFi Credentials
              </CardTitle>
              <CardDescription>
                Use these credentials to connect to the campus WiFi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* WiFi Username */}
                <div className="p-4 rounded-lg border bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-2">WiFi Username</p>
                  <div className="flex items-center justify-between">
                    <p className="font-mono font-semibold text-lg">
                      {checkInData?.wifiUsername || "Not available"}
                    </p>
                    {checkInData?.wifiUsername && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(checkInData.wifiUsername!)}
                      >
                        Copy
                      </Button>
                    )}
                  </div>
                </div>

                {/* WiFi Password */}
                <div className="p-4 rounded-lg border bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-2">WiFi Password</p>
                  <div className="flex items-center justify-between">
                    <p className="font-mono font-semibold text-lg">
                      {checkInData?.wifiPassword || "Not available"}
                    </p>
                    {checkInData?.wifiPassword && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(checkInData.wifiPassword!)}
                      >
                        Copy
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="text-sm text-muted-foreground space-y-2">
                <p className="font-medium">Connection Instructions:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Go to your device's WiFi settings</li>
                  <li>Select the campus WiFi network</li>
                  <li>Enter the username and password provided above</li>
                  <li>Accept any certificate prompts if shown</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-lg border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 px-4">
              <div className="rounded-full bg-muted p-6 mb-6">
                <span className="text-4xl">🔒</span>
              </div>
              <h3 className="text-2xl font-bold mb-2">WiFi Credentials Locked</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Complete your hostel check-in to unlock your WiFi username and password.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}