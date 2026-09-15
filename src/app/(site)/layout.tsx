import { Header, type HeaderUser } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { getCurrentUser } from "@/lib/auth";
import { unreadCount } from "@/lib/notifications";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const unread = user ? await unreadCount(user.id) : 0;

  const headerUser: HeaderUser | null = user
    ? {
        displayName: user.displayName,
        email: user.email,
        role: user.role,
        plan: user.plan,
      }
    : null;

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="grain-overlay" aria-hidden />
      <Header user={headerUser} unread={unread} />
      <main className="flex-1 pt-[var(--header-h)]">{children}</main>
      <Footer />
    </div>
  );
}
