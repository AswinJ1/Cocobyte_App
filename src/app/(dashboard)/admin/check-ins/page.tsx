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
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RefreshCw, X, Phone, Mail, Building2, MapPin, Home, DoorOpen, Clock, TimerIcon, UsersIcon, CheckIcon } from "lucide-react";

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

  const formatDateTimeShort = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
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
    const maxVisiblePages = 3; // Reduced for mobile

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 2) {
        for (let i = 1; i <= 3; i++) {
          pages.push(i);
        }
        if (totalPages > 3) {
          pages.push("...");
          pages.push(totalPages);
        }
      } else if (currentPage >= totalPages - 1) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 2; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        pages.push(currentPage);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const hasActiveFilters = siteFilter !== "All" || statusFilter !== "All" || searchQuery !== "";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="space-y-4">
            <Skeleton className="h-8 sm:h-12 w-48 sm:w-64" />
            <Skeleton className="h-6 sm:h-8 w-64 sm:w-96" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <Skeleton className="h-24 sm:h-32" />
              <Skeleton className="h-24 sm:h-32" />
              <Skeleton className="h-24 sm:h-32" />
              <Skeleton className="h-24 sm:h-32" />
            </div>
            <Skeleton className="h-[300px] sm:h-[400px]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Check-In Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Monitor and manage participant check-ins
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="h-10 w-10 sm:h-12 sm:w-12  flex items-center justify-center flex-shrink-0">
                    <UsersIcon className="text-xl sm:text-2xl"/>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Total</p>
                    <p className="text-xl sm:text-2xl font-bold">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="h-10 w-10 sm:h-12 sm:w-12  flex items-center justify-center flex-shrink-0">
                    <CheckIcon className="text-xl sm:text-2xl"/>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Checked In</p>
                    <p className="text-xl sm:text-2xl font-bold">{stats.checkedIn}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="h-10 w-10 sm:h-12 sm:w-12  flex items-center justify-center flex-shrink-0">
                    <TimerIcon className="text-xl sm:text-2xl"/>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Pending</p>
                    <p className="text-xl sm:text-2xl font-bold">{stats.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        )}

        {/* Site-wise Stats */}
        {stats && (
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">Site-wise Status</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Check-ins across all campuses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {Object.entries(stats.bySite).map(([site, data]) => (
                  <div key={site} className="p-3 sm:p-4 rounded-lg border">
                    <p className="font-semibold text-sm sm:text-base mb-2 truncate">{site}</p>
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">Done:</span>
                      <Badge
                        variant="outline"
                        className=" text-xs"
                      >
                        {data.checkedIn}/{data.total}
                      </Badge>
                    </div>
                    <div className="mt-2 h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
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
          <CardContent className="p-3 sm:p-4">
             
            <div className="space-y-3">
<CardTitle className="text-base sm:text-lg">Filter Check-Ins</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Filter check-ins by various criteria</CardDescription>
              {/* Search Input */}
              <Input
                placeholder="Search name, email, college..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
              
              {/* Filter Row */}
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <Select value={siteFilter} onValueChange={setSiteFilter}>
                  <SelectTrigger className="w-[calc(50%-4px)] sm:w-40">
                    <SelectValue placeholder="Site" />
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
                  <SelectTrigger className="w-[calc(50%-4px)] sm:w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSiteFilter("All");
                      setStatusFilter("All");
                      setSearchQuery("");
                    }}
                    className="gap-1"
                  >
                    <X className="h-3 w-3" />
                    <span className="hidden sm:inline">Clear</span>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Check-Ins List/Table */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base sm:text-lg">Participant Check-Ins</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {startIndex + 1}-{Math.min(endIndex, filteredCheckIns.length)} of {filteredCheckIns.length}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchCheckIns} className="w-full sm:w-auto gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            {paginatedCheckIns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <span className="text-4xl mb-4">🔍</span>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">No Results Found</h3>
                <p className="text-sm text-muted-foreground text-center">
                  No participants match your current filters.
                </p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="block lg:hidden space-y-3 px-3">
                  {paginatedCheckIns.map((record, index) => (
                    <Card key={record.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        {/* Header with name and status */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="min-w-0 flex-1">
                            {/* <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">#{startIndex + index + 1}</span>
                              <Badge
                                className={
                                  record.isCheckedIn
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                    : "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
                                }
                              >
                                {record.isCheckedIn ? "Checked In" : "Pending"}
                              </Badge>
                            </div> */}
                            <p className="font-semibold mt-1 truncate">{record.name}</p>
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">{record.email}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">{record.college}</span>
                          </div>

                          <div className="flex flex-wrap gap-x-4 gap-y-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                              <Badge variant="outline" className="text-xs">{record.siteName}</Badge>
                            </div>

                            {record.hostelName && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Home className="h-3.5 w-3.5 flex-shrink-0" />
                                <span>{record.hostelName}</span>
                              </div>
                            )}

                            {record.roomNumber && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <DoorOpen className="h-3.5 w-3.5 flex-shrink-0" />
                                <span>{record.roomNumber}</span>
                              </div>
                            )}
                          </div>

                          {record.isCheckedIn && record.checkInTime && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                              <span>{formatDateTimeShort(record.checkInTime)}</span>
                            </div>
                          )}
                        </div>

                        {/* Contact Button */}
                        <div className="mt-3 pt-3 border-t">
                          <a
                            href={`tel:${record.contactNumber}`}
                            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                          >
                            <Phone className="h-3.5 w-3.5" />
                             {record.contactNumber ? record.contactNumber : "Not Given"}
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
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
                         
                              {record.isCheckedIn ? "Checked In" : "Pending"}

                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatDateTime(record.checkInTime)}
                          </TableCell>
                          <TableCell>
                            <a
                              href={`tel:${record.contactNumber}`}
                              className="text-primary hover:underline"
                            >
                              {record.contactNumber ? record.contactNumber : "Not Given"}
                            </a>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t px-3 sm:px-0">
                    <p className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
                      Page {currentPage} of {totalPages}
                    </p>
                    <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => goToPage(1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      <div className="flex items-center gap-1">
                        {getPageNumbers().map((page, index) =>
                          page === "..." ? (
                            <span key={`ellipsis-${index}`} className="px-1 sm:px-2 text-muted-foreground text-sm">
                              ...
                            </span>
                          ) : (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="icon"
                              className="h-8 w-8 text-xs sm:text-sm"
                              onClick={() => goToPage(page as number)}
                            >
                              {page}
                            </Button>
                          )
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => goToPage(totalPages)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronsRight className="h-4 w-4" />
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