import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/plus";
import { todayDate } from "@/lib/dates";
import OverviewTab from "./_components/OverviewTab";
import TodayTab from "./_components/TodayTab";
import ContentTab from "./_components/ContentTab";
import SubscribersTab from "./_components/SubscribersTab";

type Tab = "overview" | "today" | "content" | "subscribers";

const TABS: { value: Tab; label: string }[] = [
  { value: "overview",     label: "overview" },
  { value: "today",        label: "today" },
  { value: "content",      label: "content" },
  { value: "subscribers",  label: "plus" },
];

const VALID_TABS = new Set<Tab>(TABS.map((t) => t.value));

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; date?: string; category?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminUser(user.id)) redirect("/");

  const params = await searchParams;
  const tab: Tab = VALID_TABS.has(params.tab as Tab) ? (params.tab as Tab) : "overview";
  const date = typeof params.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
    ? params.date
    : todayDate();
  const category = typeof params.category === "string" ? params.category : null;
  const catParam = category ? `&category=${category}` : "";

  return (
    <main className="min-h-screen bg-parchment px-4 py-6">
      <div className="mx-auto max-w-lg space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-recoleta text-[10px] font-semibold uppercase tracking-widest text-ink-muted">
              admin
            </p>
            <h1 className="font-recoleta text-2xl font-bold text-teal dark:text-ink">circa</h1>
          </div>
          <a
            href="/"
            className="font-recoleta text-xs text-ink-muted hover:text-ink transition-colors"
          >
            ← app
          </a>
        </div>

        {/* Tab navigation */}
        <nav className="flex gap-1 rounded-xl border border-ink/10 bg-surface/60 p-1 backdrop-blur-sm">
          {TABS.map(({ value, label }) => {
            const isActive = tab === value;
            const href = `/admin?tab=${value}&date=${date}${catParam}`;
            return (
              <a
                key={value}
                href={href}
                className={`flex-1 rounded-lg py-2 text-center font-recoleta text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-gold text-white shadow-sm"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {label}
              </a>
            );
          })}
        </nav>

        {/* Tab content */}
        {tab === "overview"    && <OverviewTab />}
        {tab === "today"       && <TodayTab date={date} category={category} />}
        {tab === "content"     && <ContentTab date={date} category={category} />}
        {tab === "subscribers" && <SubscribersTab />}

      </div>
    </main>
  );
}
