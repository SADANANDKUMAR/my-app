import React, { useEffect, useMemo, useState, useCallback, createContext, useContext } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import TreeTable from "./TreeTable";
/***** Helpers *****/
function formatMoney(n) {
  return "₹" + Number(n || 0).toFixed(2);
}

function downloadCSV(filename, rows) {
  if (!rows || !rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(",")]
    .concat(
      rows.map((r) =>
        keys
          .map((k) => {
            // JSON stringify to preserve commas/quotes
            return JSON.stringify(r[k] ?? "");
          })
          .join(",")
      )
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// simple tests (keeps code safe)
console.assert(typeof downloadCSV === "function", "downloadCSV exists");
console.assert(["a,b", "c,d"].join("\n") === "a,b\nc,d", "newline join works");

/***** App context & provider *****/
const AppContext = createContext(null);

function AppProvider({ children }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    // Production/local strategy: load from public folder
    fetch("/marketing_dashboard_data.json")
      .then((res) => {
        if (!res.ok) throw new Error("file not found");
        return res.json();
      })
      .then((json) => {
        setData(Array.isArray(json) ? json : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load dataset", err);
        setError(
          "Dataset could not be loaded. Ensure public/marketing_dashboard_data.json exists and is valid JSON."
        );
        setLoading(false);
      });
  }, []);

  return (
    <AppContext.Provider value={{ data, loading, error }}>
      {children}
    </AppContext.Provider>
  );
}

function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

/***** UI components *****/
function KPIBar({ data }) {
  const totals = useMemo(() => {
    let spend = 0,
      imp = 0,
      conv = 0,
      clicks = 0;
    for (const r of data) {
      spend += Number(r.spend || 0);
      imp += Number(r.impressions || 0);
      conv += Number(r.conversions || 0);
      clicks += Number(r.clicks || 0);
    }
    return { spend, imp, conv, clicks, ctr: imp ? (conv / imp) * 100 : 0 };
  }, [data]);

  const card = (label, value) => (
    <div
      style={{
        background: "#fff",
        padding: 12,
        borderRadius: 8,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      <div style={{ fontSize: 12, color: "#666" }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>{value}</div>
    </div>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12 }}>
      {card("Total Spend", formatMoney(totals.spend))}
      {card("Impressions", totals.imp.toLocaleString())}
      {card("Clicks", totals.clicks.toLocaleString())}
      {card("Conversions", totals.conv.toLocaleString())}
      {card("CTR", totals.ctr.toFixed(2) + "%")}
    </div>
  );
}

function Filters({ channels, regions, onChange }) {
  const [channel, setChannel] = useState("");
  const [region, setRegion] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    onChange({ channel, region, q });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, region, q]);

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
      <select value={channel} onChange={(e) => setChannel(e.target.value)} style={selectStyle}>
        <option value="">All Channels</option>
        {channels.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <select value={region} onChange={(e) => setRegion(e.target.value)} style={selectStyle}>
        <option value="">All Regions</option>
        {regions.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      <input
        placeholder="Search channel or region"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={inputStyle}
      />

      <button onClick={() => onChange({ channel: "", region: "", q: "" })} style={btnStyle}>
        Reset
      </button>
    </div>
  );
}

function ChartPanel({ data }) {
  // aggregate by channel
  const byChannel = useMemo(() => {
    const map = new Map();
    for (const r of data) {
      const key = r.channel || "Unknown";
      const cur = map.get(key) || { spend: 0, impressions: 0 };
      cur.spend += Number(r.spend || 0);
      cur.impressions += Number(r.impressions || 0);
      map.set(key, cur);
    }
    return Array.from(map.entries())
      .map(([channel, v]) => ({ channel, ...v }))
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 8);
  }, [data]);

  const series = byChannel.map((d) => ({ name: d.channel, spend: d.spend, impressions: d.impressions }));

  return (
    <div style={{ background: "#fff", padding: 12, borderRadius: 8 }}>
      <h4 style={{ margin: "0 0 8px 0" }}>Top Channels</h4>
      <div style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="spend" stroke="#8884d8" />
            <Line type="monotone" dataKey="impressions" stroke="#82ca9d" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TableView({ rows }) {
  const [sortBy, setSortBy] = useState("spend");
  const [sortDir, setSortDir] = useState("desc");

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      const va = a[sortBy];
      const vb = b[sortBy];
      if (va === vb) return 0;
      return va < vb ? -1 * dir : 1 * dir;
    });
    return copy;
  }, [rows, sortBy, sortDir]);

  const toggle = useCallback(
    (k) => {
      if (k === sortBy) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      else {
        setSortBy(k);
        setSortDir("desc");
      }
    },
    [sortBy]
  );

  return (
    <div style={{ background: "#fff", padding: 12, borderRadius: 8, marginTop: 12 }}>
      <div style={{ display: "flex", gap: 12, padding: "8px 6px", fontWeight: 700 }}>
        <div style={{ width: 40 }}>#</div>
        <div style={{ flex: 1, cursor: "pointer" }} onClick={() => toggle("channel")}>
          Channel
        </div>
        <div style={{ flex: 1, cursor: "pointer" }} onClick={() => toggle("region")}>
          Region
        </div>
        <div style={{ width: 110, cursor: "pointer" }} onClick={() => toggle("spend")}>
          Spend
        </div>
        <div style={{ width: 110, cursor: "pointer" }} onClick={() => toggle("impressions")}>
          Impr.
        </div>
        <div style={{ width: 90, cursor: "pointer" }} onClick={() => toggle("conversions")}>
          Conv
        </div>
        <div style={{ width: 90, cursor: "pointer" }} onClick={() => toggle("clicks")}>
          Clicks
        </div>
        <div style={{ width: 90 }}>CTR</div>
      </div>

      <div style={{ maxHeight: 360, overflow: "auto" }}>
        {sorted.map((r, i) => (
          <div
            key={r.id}
            style={{
              display: "flex",
              gap: 12,
              padding: "8px 6px",
              borderTop: "1px solid #f0f0f0",
              alignItems: "center",
            }}
          >
            <div style={{ width: 40 }}>{i + 1}</div>
            <div style={{ flex: 1 }}>{r.channel}</div>
            <div style={{ flex: 1 }}>{r.region}</div>
            <div style={{ width: 110 }}>{formatMoney(r.spend)}</div>
            <div style={{ width: 110 }}>{Number(r.impressions || 0).toLocaleString()}</div>
            <div style={{ width: 90 }}>{r.conversions}</div>
            <div style={{ width: 90 }}>{r.clicks}</div>
            <div style={{ width: 90 }}>
              {r.impressions ? ((r.conversions / r.impressions) * 100).toFixed(2) + "%" : "0.00%"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/***** Page (Grid layout) *****/

const selectStyle = { padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc" };
const inputStyle = { padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc", minWidth: 220 };
const btnStyle = { padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc", background: "#fff", cursor: "pointer" };

function Page() {
  const { data, loading, error } = useApp();
  const channels = useMemo(() => Array.from(new Set(data.map((d) => d.channel))).sort(), [data]);
  const regions = useMemo(() => Array.from(new Set(data.map((d) => d.region))).sort(), [data]);

  const [opts, setOpts] = useState({ channel: "", region: "", q: "" });

  const filtered = useMemo(() => {
    const q = opts.q.trim().toLowerCase();
    return data.filter((r) => {
      if (opts.channel && r.channel !== opts.channel) return false;
      if (opts.region && r.region !== opts.region) return false;
      if (q && !(r.channel.toLowerCase().includes(q) || r.region.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [data, opts]);

  if (loading) return <div style={{ padding: 20 }}>Loading dataset…</div>;
  if (error) return <div style={{ padding: 20, background: "#ffe8e5", borderRadius: 8 }}><strong>Error:</strong> {error}</div>;

  return (
    <div style={{ padding: 12, maxWidth: 1200, margin: "0 auto" }}>
      <h2 style={{ marginTop: 0 }}>Marketing Dashboard</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 12 }}>
        {/* <div>
          <KPIBar data={filtered} />
          <div style={{ marginTop: 12 }}>
            <Filters channels={channels} regions={regions} onChange={(o) => setOpts(o)} />
          </div>
          <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>{filtered.length} rows</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={btnStyle} onClick={() => downloadCSV("export.csv", filtered)} disabled={!filtered.length}>
                Export CSV
              </button>
            </div>
          </div>
          <TableView rows={filtered} />
        </div> */}
        <div>
  <KPIBar data={filtered} />
  <div style={{ marginTop: 12 }}>
    <Filters channels={channels} regions={regions} onChange={(o) => setOpts(o)} />
  </div>
  <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <div>{filtered.length} rows</div>
    <div style={{ display: "flex", gap: 8 }}>
      <button style={btnStyle} onClick={() => downloadCSV("export.csv", filtered)} disabled={!filtered.length}>
        Export CSV
      </button>
    </div>
  </div>
  <TableView rows={filtered} />
</div>


        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <ChartPanel data={filtered} />
          <div style={{ background: "#fff", padding: 12, borderRadius: 8 }}>
            <h4 style={{ margin: "0 0 8px 0" }}>Tips</h4>
            {/* <ul style={{ margin: "8px 0 0 18px" }}>
              <li>For production, use server-side pagination.</li>
              <li>Use virtualization for extremely long tables.</li>
              <li>Compress your bundle & enable caching.</li>
            </ul> */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Page />
    </AppProvider>
  );
}
