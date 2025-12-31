"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/dashboard-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FaBuilding } from "react-icons/fa";

interface Contact {
  id: string;
  name: string;
  role?: string;
  phone: string;
  email?: string;
  availability?: string;
  category: "hostel" | "technical" | "medical" | "food" | "transport" | "general";
  hostelName?: string; // Add this
}

interface SiteContacts {
  siteName: string;
  contacts: Contact[];
}

const SITE_HELPDESK_DATA: Record<string, SiteContacts> = {
  Amritapuri: {
    siteName: "Amritapuri",
    contacts: [
      { id: "1", name: "Biju T. S.", phone: "9400487494", hostelName: "Kailasam", category: "hostel" },
      { id: "2", name: "Prasad Kumar", phone: "9496135448", hostelName: "Shivam", category: "hostel" },
      { id: "3", name: "Suresh Kumar", phone: "8330020128", hostelName: "Shivam", category: "hostel" },
      { id: "4", name: "Lalu R.", phone: "9400012783", hostelName: "Sanathanam", category: "hostel" },
      { id: "5", name: "Uppendra N.", phone: "8943011963", hostelName: "Pravanam", category: "hostel" },
      { id: "6", name: "Abhilash Varma", phone: "8606232168", hostelName: "Pravanam", category: "hostel" },
    ],
  },
  Mysuru: {
    siteName: "Mysuru",
    contacts: [
      // { id: "1", name: "Prof. Ramesh Gowda", role: "Hostel Warden (Boys)", phone: "+91 98765 54321", email: "ramesh.warden@amrita.edu", availability: "24/7", category: "hostel" },
      // { id: "2", name: "Dr. Kavitha Rao", role: "Hostel Warden (Girls)", phone: "+91 98765 54322", email: "kavitha.warden@amrita.edu", availability: "24/7", category: "hostel" },
      // { id: "3", name: "Mahesh Kumar", role: "Technical Support Lead", phone: "+91 98765 54323", email: "tech.mysuru@amrita.edu", availability: "8 AM - 10 PM", category: "technical" },
      // { id: "4", name: "Dr. Anand Murthy", role: "Medical Officer", phone: "+91 98765 54324", availability: "24/7 Emergency", category: "medical" },
      // { id: "5", name: "Shivanna", role: "Food & Catering Head", phone: "+91 98765 54325", availability: "6 AM - 10 PM", category: "food" },
      // { id: "6", name: "Prakash Hegde", role: "Transport Coordinator", phone: "+91 98765 54326", availability: "6 AM - 8 PM", category: "transport" },
      // { id: "7", name: "Help Desk", role: "General Enquiries", phone: "+91 98765 54300", email: "helpdesk.mysuru@amrita.edu", availability: "24/7", category: "general" },
    ],
  },
 Coimbatore: {
  siteName: "Coimbatore",
  contacts: [
    { id: "1", name: "Aravindan", phone: "+91 9526638396", hostelName: "Kashyapa Bhavanam", category: "hostel" },
    { id: "2", name: "Rajeswaran", phone: "+91 6381517190", hostelName: "Kashyapa Bhavanam", category: "hostel" },
    { id: "3", name: "Sulochana", phone: "+91 6238021345", hostelName: "Adithi Bhavanam", category: "hostel" },
    { id: "4", name: "Gopalanunni", phone: "+91 8301876419", hostelName: "Kashyapa Bhavanam Annexe", category: "hostel" },
    { id: "5", name: "Venugopalan", phone: "+91 7795040462", hostelName: "Yagnavalkya Bhavanam", category: "hostel" },
  ],
}
,
  Bangalore: {
    siteName: "Bangalore",
    contacts: [
      // { id: "1", name: "Prof. Naveen Reddy", role: "Hostel Warden (Boys)", phone: "+91 98765 76543", email: "naveen.warden@amrita.edu", availability: "24/7", category: "hostel" },
      // { id: "2", name: "Dr. Suma Rao", role: "Hostel Warden (Girls)", phone: "+91 98765 76544", email: "suma.warden@amrita.edu", availability: "24/7", category: "hostel" },
      // { id: "3", name: "Girish Babu", role: "Technical Support Lead", phone: "+91 98765 76545", email: "tech.blr@amrita.edu", availability: "8 AM - 10 PM", category: "technical" },
      // { id: "4", name: "Dr. Ashwin Kumar", role: "Medical Officer", phone: "+91 98765 76546", availability: "24/7 Emergency", category: "medical" },
      // { id: "5", name: "Ravi Shankar", role: "Food & Catering Head", phone: "+91 98765 76547", availability: "6 AM - 10 PM", category: "food" },
      // { id: "6", name: "Manjunath", role: "Transport Coordinator", phone: "+91 98765 76548", availability: "6 AM - 8 PM", category: "transport" },
      // { id: "7", name: "Help Desk", role: "General Enquiries", phone: "+91 98765 76500", email: "helpdesk.blr@amrita.edu", availability: "24/7", category: "general" },
    ],
  },
};

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  hostel: { label: "Hostel", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400" },
  technical: { label: "Technical", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400" },
  medical: { label: "Medical", color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400" },
  food: { label: "Food & Catering", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400" },
  transport: { label: "Transport", color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" },
  general: { label: "General", color: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400" },
};

export default function HelpdeskPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [siteName, setSiteName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    if (!session || (session.user.role as string) !== "PARTICIPANT") {
      router.push("/");
      return;
    }
    fetchProfile();
  }, [session, router]);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile");
      if (response.ok) {
        const data = await response.json();
        setSiteName(data.participant?.siteName || null);
      } else {
        setError("Failed to load profile data");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setError("Error loading profile");
    } finally {
      setIsLoading(false);
    }
  };

  const getSiteContacts = (): SiteContacts | null => {
    if (!siteName || !SITE_HELPDESK_DATA[siteName]) {
      return null;
    }
    return SITE_HELPDESK_DATA[siteName];
  };

  const filteredContacts = () => {
    const siteData = getSiteContacts();
    if (!siteData) return [];
    
    if (activeCategory === "all") {
      return siteData.contacts;
    }
    return siteData.contacts.filter((contact) => contact.category === activeCategory);
  };

  const categories = ["all", "hostel"];
  // , "technical", "medical", "food", "transport", "general"

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-4">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-8 w-96" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const siteContacts = getSiteContacts();

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Helpdesk</h1>
          <p className="text-muted-foreground mt-1">
            {siteName 
              ? `Contact information for ${siteName} campus` 
              : "Contact information and support"}
          </p>
        </div>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* No Site Assigned */}
        {!siteName && !error && (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 px-4">
              <div className="rounded-full bg-muted p-6 mb-6">
                <span className="text-4xl">📍</span>
              </div>
              <h3 className="text-2xl font-bold mb-2">No Site Assigned</h3>
              <p className="text-muted-foreground text-center max-w-md">
                You haven't been assigned to a site yet. Please contact the event organizers for assistance.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Site Contacts */}
        {siteContacts && (
          <>
            {/* Site Badge */}
            <Card className="bg-background border-none">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12  flex items-center justify-center">
                    <span className="text-2xl"><FaBuilding /></span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{siteContacts.siteName} Campus</h2>
                    {/* <p className="text-muted-foreground">
                      {siteContacts.contacts.length} contacts available
                    </p> */}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={activeCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(category)}
                >
                  {category === "all" ? "All" : CATEGORY_LABELS[category]?.label || category}
                </Button>
              ))}
            </div>

            {/* Contacts Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {filteredContacts().map((contact) => (
    <Card key={contact.id} className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{contact.name}</CardTitle>
            {contact.role && (
              <CardDescription className="mt-1">{contact.role}</CardDescription>
            )}
          </div>
          <Badge className={CATEGORY_LABELS[contact.category]?.color}>
            {CATEGORY_LABELS[contact.category]?.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Phone</p>
          <a 
            href={`tel:${contact.phone.replace(/\s/g, "")}`}
            className="text-base font-semibold text-primary hover:underline"
          >
            {contact.phone}
          </a>
        </div>

        {contact.hostelName && (
          <div>
            <p className="text-sm text-muted-foreground mb-1">Hostel</p>
            <Badge variant="outline">{contact.hostelName}</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  ))}
</div>


            {/* No Results */}
            {filteredContacts().length === 0 && (
              <Card className="border-2 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 px-4">
                  <h3 className="text-xl font-bold mb-2">No Contacts Found</h3>
                  <p className="text-muted-foreground text-center">
                    Contacts will be available soon for this category.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}