import Image from "next/image";
import Link from "next/link";
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6">
      {/* Logo */}
      <div className="flex flex-col items-center gap-4">
        <Image
          src="/logo.png" // make sure this file exists in public/
          alt="Amrita Logo"
          width={120}
          height={120}
          priority
        />
        <h1 className="text-2xl font-semibold tracking-tight">
          Hostel Management System
        </h1>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          A minimal portal for students to manage hostel stay, registrations, 
          and related activities at Amrita.
        </p>
      </div>

      {/* Buttons */}
      <div className="mt-8 flex gap-4">
        <Link
          href="/login"
          className="px-6 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium shadow hover:bg-primary/90 transition-colors"
        >
          Hostel/ Student/ participant Login
        </Link>
        <Link
          href="/register"
          className="px-6 py-2 rounded-md border border-input bg-background text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          Register
        </Link>
      </div>
    </div>
  );
}
