import { Header, type HeaderUser } from "@/components/site/Header";
import { AccountSidebar, AccountTabBar } from "@/components/site/AccountNav";
import { requireUser } from "@/lib/auth";
import { unreadCount } from "@/lib/notifications";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const unread = await unreadCount(user.id);

  const headerUser: HeaderUser = {
    displayName: user.displayName,
    email: user.email,
    role: user.role,
    plan: user.plan,
  };

  return (
    <div className="min-h-dvh">
      <Header user={headerUser} unread={unread} />

      <div className="mx-auto grid max-w-[1280px] gap-10 px-4 pb-28 pt-8 sm:px-6 lg:grid-cols-[212px_minmax(0,1fr)] lg:px-8 lg:pb-16">
        <AccountSidebar unread={unread} />
        <main className="min-w-0">{children}</main>
      </div>

      <AccountTabBar unread={unread} />
    </div>
  );
}
