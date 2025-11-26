// app/(auth)/register/page.tsx

import { RegisterForm } from "@/components/auth/register-form"

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12">
      <RegisterForm />
    </div>
  )
}