import { useLoaderData, useSearchParams } from "react-router";
import {
  Badge,
  Button,
  BlockStack,
  Card,
  DataTable,
  InlineStack,
  Layout,
  Page,
  Pagination,
  Select,
  Text,
  TextField,
} from "@shopify/polaris";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import styles from "../styles/analytics.module.css";

const PAGE_SIZE = 25;
const PLAN_PRICES = {
  STARTER: { monthly: 14, yearly: 140 },
  PRO: { monthly: 39, yearly: 390 },
  PRO_PLUS: { monthly: 59, yearly: 590 },
};

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function recurringRevenue(configuration) {
  const plan = String(configuration?.plan ?? "SANDBOX").toUpperCase();
  const cycle = String(configuration?.billingCycle ?? "monthly").toLowerCase();
  if (configuration?.billingStatus !== "ACTIVE" || !PLAN_PRICES[plan]) return 0;
  return PLAN_PRICES[plan][cycle === "yearly" ? "yearly" : "monthly"];
}

function formatDate(value) {
  return value
    ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value))
    : "—";
}

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);
  // if (session.accountOwner !== true) {
  //   throw new Response("Analytics is restricted to the app owner.", { status: 403 });
  // }

  const url = new URL(request.url);
  const search = url.searchParams.get("q")?.trim().toLowerCase() ?? "";
  const status = url.searchParams.get("status") ?? "all";
  const plan = url.searchParams.get("plan") ?? "all";
  const sort = url.searchParams.get("sort") ?? "createdAt";
  const direction = url.searchParams.get("direction") === "asc" ? "asc" : "desc";
  const page = Math.max(1, Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1);

  const shops = await db.shop.findMany({
    include: { configuration: true },
    orderBy: { createdAt: direction },
  });
  const sessions = await db.session.findMany({
    where: { shop: { in: shops.map((shop) => shop.shopDomain) } },
    select: { shop: true },
    distinct: ["shop"],
  });
  const activeShops = new Set(sessions.map(({ shop }) => shop));

  const allRows = shops.map((shop) => ({
    id: shop.id,
    domain: shop.shopDomain,
    installed: activeShops.has(shop.shopDomain),
    plan: String(shop.configuration?.plan ?? "SANDBOX").toUpperCase(),
    billingStatus: shop.configuration?.billingStatus ?? "INACTIVE",
    billingCycle: shop.configuration?.billingCycle ?? "—",
    revenue: recurringRevenue(shop.configuration),
    installedAt: shop.createdAt,
  }));
  const planMix = ["SANDBOX", "STARTER", "PRO", "PRO_PLUS"].map((value) => ({
    plan: value,
    count: allRows.filter((row) => row.plan === value).length,
  }));
  const monthCounts = new Map();
  for (const row of allRows) {
    const date = new Date(row.installedAt);
    const key = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
  }
  const installsByMonth = [...monthCounts.entries()]
    .sort(([left], [right]) => left.localeCompare(right, "en-US", { dateStyle: "medium" }))
    .slice(-6)
    .map(([month, count]) => ({ month, count }));

  let rows = [...allRows];

  rows = rows.filter((row) => {
    const matchesSearch = !search || `${row.domain} ${row.id}`.toLowerCase().includes(search);
    const matchesStatus = status === "all" || (status === "active" ? row.installed : !row.installed);
    const matchesPlan = plan === "all" || row.plan === plan;
    return matchesSearch && matchesStatus && matchesPlan;
  });

  if (sort === "domain" || sort === "plan" || sort === "revenue") {
    rows.sort((left, right) => {
      const a = sort === "revenue" ? left.revenue : left[sort];
      const b = sort === "revenue" ? right.revenue : right[sort];
      const comparison = typeof a === "number" ? a - b : String(a).localeCompare(String(b));
      return direction === "asc" ? comparison : -comparison;
    });
  }

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const revenue = allRows.reduce((sum, row) => sum + row.revenue, 0);

  return {
    rows: pagedRows,
    total,
    totalPages,
    currentPage,
    summary: { installed: shops.length, active: shops.filter((shop) => activeShops.has(shop.shopDomain)).length, uninstalled: shops.length - activeShops.size, revenue },
    planMix,
    installsByMonth,
    filters: { search, status, plan, sort, direction },
  };
}

function planLabel(plan) {
  return plan === "PRO_PLUS" ? "Pro+" : plan.charAt(0) + plan.slice(1).toLowerCase();
}

const PLAN_COLORS = {
  SANDBOX: "#93a4b8",
  STARTER: "#3b82f6",
  PRO: "#35c5a5",
  PRO_PLUS: "#8457e8",
};

function chartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return <div className={styles.chartTooltip}><strong>{label}</strong><span>{payload[0].value} installs</span></div>;
}

function planTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return <div className={styles.chartTooltip}><strong>{planLabel(item.plan)}</strong><span>{item.count} stores ({item.percent}%)</span></div>;
}

function ChartCard({ title, children, note }) {
  return <Card><BlockStack gap="300"><InlineStack align="space-between"><Text as="h2" variant="headingMd">{title}</Text>{note && <Text tone="subdued">{note}</Text>}</InlineStack>{children}</BlockStack></Card>;
}

export default function Analytics() {
  const [params, setParams] = useSearchParams();
  const data = useLoaderData();
  const totalStores = data.summary.installed;
  const planChartData = data.planMix.map((item) => ({
    ...item,
    percent: totalStores ? Math.round((item.count / totalStores) * 100) : 0,
  }));
  const pieData = totalStores ? planChartData.filter((item) => item.count > 0) : [{ plan: "EMPTY", count: 1, percent: 0 }];

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value && value !== "all") next.set(key, value); else next.delete(key);
    next.delete("page");
    setParams(next);
  };

  const rows = data.rows.map((row) => [
    <div className={styles.storeCell}><span className={styles.storeAvatar}>{row.domain.slice(0, 2).toUpperCase()}</span><span>{row.domain}</span></div>,
    <span className={styles.shopId}>{row.id}</span>,
    row.installed ? <Badge tone="success">Active</Badge> : <Badge>Uninstalled</Badge>,
    <Badge tone={row.plan === "SANDBOX" ? undefined : "info"}>{planLabel(row.plan)}</Badge>,
    <span className={row.billingStatus === "ACTIVE" ? styles.billingActive : styles.billingInactive}>{row.billingStatus === "ACTIVE" ? "Active" : "Inactive"}</span>,
    row.billingCycle,
    money(row.revenue),
    formatDate(row.installedAt),
  ]);

  const exportRows = () => {
    const csv = [
      ["Store", "Shop ID", "Status", "Plan", "Billing", "Cycle", "Revenue", "Installed"],
      ...data.rows.map((row) => [row.domain, row.id, row.installed ? "Active" : "Uninstalled", row.plan, row.billingStatus, row.billingCycle, row.revenue, formatDate(row.installedAt)]),
    ].map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    link.download = "app-analytics.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <Page title="" fullWidth>
      <div className={styles.analyticsPage}>
        <Layout>
          <Layout.Section>
            <div className={styles.header}>
              <div className={styles.headerIcon}>▥</div>
              <div><Text as="h1" variant="heading2xl">App analytics</Text><Text tone="subdued">Track installs, plans and revenue across all stores</Text></div>
              <div className={styles.headerActions}><Select label="Period" labelHidden options={[{ label: "All time", value: "all" }]} value="all" onChange={() => { }} /><Button onClick={exportRows}>Export</Button></div>
            </div>
            <div className={styles.metrics}>
              {[['Total stores', data.summary.installed, 'blue'], ['Active stores', data.summary.active, 'green'], ['Uninstalled stores', data.summary.uninstalled, 'red'], ['Current recurring revenue', money(data.summary.revenue), 'gold']].map(([label, value, tone]) => <div className={styles.metricCard} key={label}><Card><div className={`${styles.metric} ${styles[tone]}`}><Text as="p" tone="subdued">{label}</Text><Text as="p" variant="heading2xl">{value}</Text><Text as="p" tone="subdued">{label === 'Current recurring revenue' ? 'Active paid subscriptions' : `${label === 'Total stores' ? data.summary.installed : label === 'Active stores' ? data.summary.active : data.summary.uninstalled} stores`}</Text></div></Card></div>)}
            </div>
          </Layout.Section>
          <Layout.Section>
            <div className={styles.charts}>
              <ChartCard title="New installs" note="by month">
                <div className={styles.barChart}>
                  {data.installsByMonth.length ? <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data.installsByMonth} margin={{ top: 24, right: 12, left: 0, bottom: 4 }}>
                      <CartesianGrid stroke="#e9edf2" vertical={false} />
                      <XAxis dataKey="month" tickFormatter={(month) => month.split(" ")[0]} tickLine={false} axisLine={false} tick={{ fill: "#52606d", fontSize: 12 }} />
                      <YAxis allowDecimals={false} width={28} tickLine={false} axisLine={false} tick={{ fill: "#52606d", fontSize: 12 }} />
                      <Tooltip content={chartTooltip} cursor={{ fill: "rgba(59,130,246,.06)" }} />
                      <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={76}>
                        <LabelList dataKey="count" position="top" fill="#334155" fontSize={12} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer> : <div className={styles.chartEmpty}>No installation data yet</div>}
                </div>
              </ChartCard>
              <ChartCard title="Plan mix">
                <div className={styles.planMix}>
                  <div className={styles.donutChart}>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={pieData} dataKey="count" nameKey="plan" innerRadius={64} outerRadius={88} paddingAngle={totalStores ? 1 : 0} stroke="none">
                          {pieData.map((item) => <Cell key={item.plan} fill={PLAN_COLORS[item.plan] ?? "#e2e8f0"} />)}
                        </Pie>
                        {totalStores > 0 && <Tooltip content={planTooltip} />}
                        <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" className={styles.donutValue}>{totalStores}</text>
                        <text x="50%" y="59%" textAnchor="middle" dominantBaseline="middle" className={styles.donutLabel}>stores</text>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className={styles.planLegend}>{data.planMix.map((item) => <div className={styles.legendRow} key={item.plan}><span className={styles.legendName}><span className={styles.legendDot} style={{ background: PLAN_COLORS[item.plan] }} />{planLabel(item.plan)}</span><span>{item.count} <em>({totalStores ? Math.round(item.count / totalStores * 100) : 0}%)</em></span></div>)}</div>
                </div>
              </ChartCard>
            </div>
          </Layout.Section>
          <Layout.Section>
            <div className={styles.tableCard}><Card>
              <BlockStack gap="400">
                <div className={styles.toolbar}>
                  <TextField label="Search stores" labelHidden placeholder="Search by store or ID" value={data.filters.search} onChange={(value) => update("q", value)} autoComplete="off" />
                  <Select label="Status" labelHidden options={[{ label: "All statuses", value: "all" }, { label: "Active", value: "active" }, { label: "Uninstalled", value: "uninstalled" }]} value={data.filters.status} onChange={(value) => update("status", value)} />
                  <Select label="Plan" labelHidden options={[{ label: "All plans", value: "all" }, "SANDBOX", "STARTER", "PRO", "PRO_PLUS"].map((value) => typeof value === "string" ? { label: value, value } : value)} value={data.filters.plan} onChange={(value) => update("plan", value)} />
                  <Select label="Sort" labelHidden options={[{ label: "Newest", value: "createdAt" }, { label: "Store", value: "domain" }, { label: "Plan", value: "plan" }, { label: "Revenue", value: "revenue" }]} value={data.filters.sort} onChange={(value) => update("sort", value)} />
                </div>
                <DataTable columnContentTypes={["text", "text", "text", "text", "text", "text", "numeric", "text"]} headings={["Store", "Shop ID", "Status", "Plan", "Billing", "Cycle", "Revenue", "Installed"]} rows={rows} />
                <InlineStack align="center"><Pagination hasPrevious={data.currentPage > 1} onPrevious={() => update("page", String(data.currentPage - 1))} hasNext={data.currentPage < data.totalPages} onNext={() => update("page", String(data.currentPage + 1))} /></InlineStack>
              </BlockStack>
            </Card></div>
          </Layout.Section>
        </Layout>
      </div>
    </Page>
  );
}
