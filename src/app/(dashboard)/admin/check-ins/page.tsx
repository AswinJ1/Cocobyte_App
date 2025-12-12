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
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CheckInRecord {
  id: string;
  name: string;
  email: string;
  college: string;
  siteName: string;
  hostelName: string;
  roomNumber: string;
  isCheckedIn: boolean;
  checkInTime: string | null;
  contactNumber: string;
}

interface CheckInStats {
  total: number;
  checkedIn: number;
  pending: number;
  bySite: Record<string, { total: number; checkedIn: number }>;
}

const SITES = ["All", "Amritapuri", "Mysuru", "Coimbatore", "Bangalore"];
const STATUSES = ["All", "Checked In", "Pending"];
const ITEMS_PER_PAGE = 50;

export default function AdminCheckInsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);
  const [stats, setStats] = useState<CheckInStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [siteFilter, setSiteFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!session || (session.user.role as string) !== "ADMIN") {
      router.push("/");
      return;
    }
    fetchCheckIns();
  }, [session, router]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [siteFilter, statusFilter, searchQuery]);

  const fetchCheckIns = async () => {
    try {
      const response = await fetch("/api/admin/check-ins");
      if (response.ok) {
        const data = await response.json();
        setCheckIns(data.checkIns);
        setStats(data.stats);
      } else {
        setError("Failed to load check-in data");
      }
    } catch (error) {
      console.error("Error fetching check-ins:", error);
      setError("Error loading check-in data");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredCheckIns = checkIns.filter((record) => {
    const matchesSite = siteFilter === "All" || record.siteName === siteFilter;
    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Checked In" && record.isCheckedIn) ||
      (statusFilter === "Pending" && !record.isCheckedIn);
    const matchesSearch =
      searchQuery === "" ||
      record.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.college.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSite && matchesStatus && matchesSearch;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredCheckIns.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedCheckIns = filteredCheckIns.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-4">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-8 w-96" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
            <Skeleton className="h-[400px]" />
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
          <h1 className="text-3xl font-bold tracking-tight">Check-In Management</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage participant check-ins across all sites
          </p>
        </div>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Participants</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <span className="text-2xl">✅</span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Checked In</p>
                    <p className="text-2xl font-bold text-green-600">{stats.checkedIn}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                    <span className="text-2xl">⏳</span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Check-In Rate</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {stats.total > 0 ? Math.round((stats.checkedIn / stats.total) * 100) : 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Site-wise Stats */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle>Site-wise Check-In Status</CardTitle>
              <CardDescription>Overview of check-ins across all campuses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(stats.bySite).map(([site, data]) => (
                  <div key={site} className="p-4 rounded-lg border">
                    <p className="font-semibold mb-2">{site}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Checked In:</span>
                      <Badge
                        variant="outline"
                        className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                      >
                        {data.checkedIn}/{data.total}
                      </Badge>
                    </div>
                    <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all"
                        style={{
                          width: `${data.total > 0 ? (data.checkedIn / data.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by name, email, or college..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={siteFilter} onValueChange={setSiteFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by Site" />
                </SelectTrigger>
                <SelectContent>
                  {SITES.map((site) => (
                    <SelectItem key={site} value={site}>
                      {site}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => {
                  setSiteFilter("All");
                  setStatusFilter("All");
                  setSearchQuery("");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Check-Ins Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Participant Check-Ins</CardTitle>
                <CardDescription>
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredCheckIns.length)} of{" "}
                  {filteredCheckIns.length} participants
                </CardDescription>
              </div>
              <Button variant="outline" onClick={fetchCheckIns}>
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {paginatedCheckIns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <span className="text-4xl mb-4">🔍</span>
                <h3 className="text-xl font-semibold mb-2">No Results Found</h3>
                <p className="text-muted-foreground text-center">
                  No participants match your current filters.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>College</TableHead>
                        <TableHead>Site</TableHead>
                        <TableHead>Hostel</TableHead>
                        <TableHead>Room</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Check-In Time</TableHead>
                        <TableHead>Contact</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedCheckIns.map((record, index) => (
                        <TableRow key={record.id}>
                          <TableCell className="text-muted-foreground">
                            {startIndex + index + 1}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{record.name}</p>
                              <p className="text-sm text-muted-foreground">{record.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {record.college}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{record.siteName}</Badge>
                          </TableCell>
                          <TableCell>{record.hostelName || "—"}</TableCell>
                          <TableCell>{record.roomNumber || "—"}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                record.isCheckedIn
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                  : "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
                              }
                            >
                              {record.isCheckedIn ? "Checked In" : "Pending"}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatDateTime(record.checkInTime)}
                          </TableCell>
                          <TableCell>
                            <a
                              href={`tel:${record.contactNumber}`}
                              className="text-primary hover:underline"
                            >
                              {record.contactNumber}
                            </a>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages} ({filteredCheckIns.length} total records)
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(1)}
                        disabled={currentPage === 1}
                      >
                        First
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>

                      <div className="flex items-center gap-1">
                        {getPageNumbers().map((page, index) =>
                          page === "..." ? (
                            <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                              ...
                            </span>
                          ) : (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => goToPage(page as number)}
                              className="w-10"
                            >
                              {page}
                            </Button>
                          )
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(totalPages)}
                        disabled={currentPage === totalPages}
                      >
                        Last
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}