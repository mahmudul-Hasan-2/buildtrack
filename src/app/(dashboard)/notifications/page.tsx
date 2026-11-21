import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/permissions";
import { markRead, markAllRead } from "@/actions/notification";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function NotificationsPage() {
  const user = await requireUser();
  const items = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const unread = items.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0B192C]">Notifications</h1>
          <p className="text-sm text-slate-500">{unread} unread</p>
        </div>
        {unread > 0 && (
          <form action={markAllRead}>
            <Button type="submit" variant="outline" size="sm">
              Mark all as read
            </Button>
          </form>
        )}
      </div>

      {items.length === 0 && (
        <p className="py-10 text-center text-slate-500">No notifications.</p>
      )}

      <div className="space-y-2">
        {items.map((n) => (
          <Card
            key={n.id}
            className={n.isRead ? "" : "border-orange-300 bg-orange-50/40"}
          >
            <CardContent className="flex items-start justify-between gap-3 pt-4 text-sm">
              <div>
                <p className="font-semibold text-[#0B192C]">{n.title}</p>
                <p className="text-slate-600">{n.message}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {n.createdAt.toLocaleString()}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {n.link && (
                  <Button asChild size="sm" variant="ghost">
                    <Link href={n.link}>Open</Link>
                  </Button>
                )}
                {!n.isRead && (
                  <form action={markRead.bind(null, n.id)}>
                    <Button type="submit" size="sm" variant="outline">
                      Mark read
                    </Button>
                  </form>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
