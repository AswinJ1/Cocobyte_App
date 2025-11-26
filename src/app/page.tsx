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
          CocoByte 
        </h1>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          A minimal portal for participants to get status of icpc contest 
          and related activities at Amrita.
        </p>
      </div>

      {/* Buttons */}
      <div className="mt-8 flex gap-4">
        <Link
          href="/login"
          className="px-6 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium shadow hover:bg-primary/90 transition-colors"
        >
          Login
        </Link>
      </div>
    </div>
  );
}
