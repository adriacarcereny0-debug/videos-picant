import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminGateForm } from "@/components/admin/AdminGateForm";
import { Logo } from "@/components/Logo";
import { adminGateOpen } from "@/lib/adminGate";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Acceso al panel",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const user = await getCurrentUser();
  if (user?.role === "ADMIN" || (await adminGateOpen())) redirect("/admin");

  return (
    <main className="grid min-h-dvh place-items-center px-5 py-20">
      <div className="w-full max-w-[380px]">
        <div className="mb-12 flex justify-center">
          <Logo href={null} size="lg" />
        </div>

        <p className="eyebrow mb-5">Administración</p>
        <h1 className="display-md mb-7 text-ink">Acceso al panel</h1>

        <AdminGateForm />
      </div>
    </main>
  );
}
