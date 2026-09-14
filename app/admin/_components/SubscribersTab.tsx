import { createServiceClient } from "@/lib/supabase/server";

interface PlusRow {
  plan: string;
  status: string;
  created_at: string;
  updated_at: string;
}

function formatMonth(yearMonth: string): string {
  const [yr, mo] = yearMonth.split("-").map(Number);
  return new Date(Date.UTC(yr, mo - 1, 1)).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function SubscribersTab() {
  const serviceClient = createServiceClient();

  const { data: rows } = await serviceClient
    .from("user_plus")
    .select("plan, status, created_at, updated_at");

  const allRows = (rows ?? []) as PlusRow[];

  const activeRows   = allRows.filter((r) => r.status === "active");
  const activeTotal   = activeRows.length;
  const activeMonthly = activeRows.filter((r) => r.plan === "monthly").length;
  const activeAnnual  = activeRows.filter((r) => r.plan === "annual").length;

  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);

  const newThisMonth = allRows.filter((r) => r.created_at.startsWith(currentMonth)).length;
  const churnedThisMonth = allRows.filter(
    (r) => r.status !== "active" && r.updated_at.startsWith(currentMonth)
  ).length;
  const netThisMonth = newThisMonth - churnedThisMonth;

  // Build last 6 months
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toISOString().slice(0, 7));
  }

  const trend = months.map((month) => {
    const [yr, mo] = month.split("-").map(Number);
    // First day of next month — used as exclusive upper bound
    const nextMonthStr = new Date(Date.UTC(yr, mo, 1)).toISOString().slice(0, 10);

    const newCount = allRows.filter((r) => r.created_at.startsWith(month)).length;
    const churnedCount = allRows.filter(
      (r) => r.status !== "active" && r.updated_at.startsWith(month)
    ).length;
    // Active at end of this month: joined before next month AND (still active OR cancelled after this month)
    const runningTotal = allRows.filter(
      (r) =>
        r.created_at < nextMonthStr &&
        (r.status === "active" || r.updated_at >= nextMonthStr)
    ).length;

    return { month, newCount, churnedCount, net: newCount - churnedCount, runningTotal };
  });

  return (
    <div className="space-y-4">
      {/* Active count tiles */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-ink/10 bg-surface/60 p-4 text-center backdrop-blur-sm">
          <p className="font-recoleta text-[10px] font-semibold uppercase tracking-widest text-ink-muted mb-1">
            active
          </p>
          <p className="font-recoleta text-3xl font-bold text-gold">{activeTotal}</p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-surface/60 p-4 text-center backdrop-blur-sm">
          <p className="font-recoleta text-[10px] font-semibold uppercase tracking-widest text-ink-muted mb-1">
            monthly
          </p>
          <p className="font-recoleta text-3xl font-bold text-teal dark:text-ink">{activeMonthly}</p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-surface/60 p-4 text-center backdrop-blur-sm">
          <p className="font-recoleta text-[10px] font-semibold uppercase tracking-widest text-ink-muted mb-1">
            annual
          </p>
          <p className="font-recoleta text-3xl font-bold text-teal dark:text-ink">{activeAnnual}</p>
        </div>
      </div>

      {/* This month summary */}
      <div className="rounded-2xl border border-ink/10 bg-surface/60 p-4 backdrop-blur-sm">
        <p className="font-recoleta text-[10px] font-semibold uppercase tracking-widest text-ink-muted mb-3">
          this month
        </p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="font-recoleta text-2xl font-bold text-green-500">+{newThisMonth}</p>
            <p className="font-recoleta text-[10px] text-ink-muted mt-0.5">new</p>
          </div>
          <div>
            <p className="font-recoleta text-2xl font-bold text-red-400">-{churnedThisMonth}</p>
            <p className="font-recoleta text-[10px] text-ink-muted mt-0.5">churned</p>
          </div>
          <div>
            <p className={`font-recoleta text-2xl font-bold ${netThisMonth >= 0 ? "text-green-500" : "text-red-400"}`}>
              {netThisMonth >= 0 ? "+" : ""}{netThisMonth}
            </p>
            <p className="font-recoleta text-[10px] text-ink-muted mt-0.5">net</p>
          </div>
        </div>
      </div>

      {/* 6-month trend table */}
      <div>
        <p className="font-recoleta text-xs font-semibold uppercase tracking-widest text-ink-muted mb-3">
          6-month trend
        </p>
        <div className="rounded-2xl border border-ink/10 bg-surface/60 overflow-hidden backdrop-blur-sm">
          <div className="grid grid-cols-5 px-4 py-2 border-b border-ink/8 bg-surface/40">
            {["month", "new", "lost", "net", "total"].map((h) => (
              <p key={h} className="font-recoleta text-[9px] font-semibold uppercase tracking-widest text-ink-muted text-center">
                {h}
              </p>
            ))}
          </div>
          {trend.map(({ month, newCount, churnedCount, net, runningTotal }) => (
            <div key={month} className="grid grid-cols-5 px-4 py-2.5 border-b border-ink/5 last:border-0">
              <p className="font-recoleta text-xs text-ink-muted">{formatMonth(month)}</p>
              <p className="font-recoleta text-xs font-semibold text-green-500 text-center">
                +{newCount}
              </p>
              <p className="font-recoleta text-xs font-semibold text-red-400 text-center">
                -{churnedCount}
              </p>
              <p className={`font-recoleta text-xs font-semibold text-center ${net >= 0 ? "text-green-500" : "text-red-400"}`}>
                {net >= 0 ? "+" : ""}{net}
              </p>
              <p className="font-recoleta text-xs font-bold text-teal dark:text-ink text-center">
                {runningTotal}
              </p>
            </div>
          ))}
        </div>
        <p className="font-recoleta text-[9px] text-ink-muted/50 mt-2 text-center">
          churn date is approximate — based on subscription updated_at
        </p>
      </div>
    </div>
  );
}
