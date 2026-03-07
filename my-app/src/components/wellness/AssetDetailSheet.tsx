import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, Defs, LinearGradient, Stop } from "react-native-svg";
import { TrendingUp, Home, PiggyBank, Bitcoin, ScrollText } from "lucide-react-native";
import { C, pctC, fmt } from './constants';
import { ProgressBar, styles } from './SharedUI';

// ── static data ────────────────────────────────────────────────────────────────

const ASSET_META: Record<string, {
  subtitle: string;
  description: string;
  diversification: number;
  liquidity: number;
}> = {
  Stocks: {
    subtitle: "Equity Investments",
    description: "Your stock portfolio includes individual stocks and index funds. Stocks offer high growth potential but come with higher volatility.",
    diversification: 85,
    liquidity: 95,
  },
  "Real Estate": {
    subtitle: "Property & REITs",
    description: "A mix of physical real estate and REITs providing income, appreciation, and an inflation hedge over the long term.",
    diversification: 60,
    liquidity: 30,
  },
  Savings: {
    subtitle: "Cash & High-Yield",
    description: "Emergency fund and high-yield savings accounts. Ultra-low risk with stable, predictable returns.",
    diversification: 20,
    liquidity: 100,
  },
  Crypto: {
    subtitle: "Digital Assets",
    description: "Cryptocurrency holdings including Bitcoin and Ethereum. High risk, high reward with significant price volatility.",
    diversification: 40,
    liquidity: 90,
  },
  Bonds: {
    subtitle: "Fixed Income",
    description: "Government and corporate bonds providing steady income. Lower risk with predictable interest payments.",
    diversification: 70,
    liquidity: 65,
  },
};

const ASSET_HOLDINGS: Record<string, { ticker: string; name: string; value: number; change: number }[]> = {
  Stocks: [
    { ticker: "AAPL", name: "Apple Inc.",        value: 45000, change:  2.3 },
    { ticker: "TSLA", name: "Tesla",             value: 38000, change: -1.2 },
    { ticker: "VOO",  name: "Vanguard S&P 500",  value: 75000, change:  1.8 },
    { ticker: "MSFT", name: "Microsoft",         value: 27000, change:  3.1 },
  ],
  "Real Estate": [
    { ticker: "O",    name: "Realty Income",     value: 20000, change:  0.4 },
    { ticker: "VNQ",  name: "Vanguard REIT ETF", value: 80000, change:  1.1 },
    { ticker: "PHYS", name: "Physical Property", value: 50000, change:  0.2 },
  ],
  Savings: [
    { ticker: "HYSA", name: "High-Yield Savings", value: 45000, change: 0.04 },
    { ticker: "MMF",  name: "Money Market Fund",  value: 30000, change: 0.03 },
  ],
  Crypto: [
    { ticker: "BTC",  name: "Bitcoin",  value: 32000, change: -3.1 },
    { ticker: "ETH",  name: "Ethereum", value: 13000, change: -1.8 },
  ],
  Bonds: [
    { ticker: "BND",  name: "Vanguard Bond ETF", value: 20000, change:  0.1 },
    { ticker: "TLT",  name: "iShares 20Y+ Tsy",  value: 12500, change: -0.2 },
  ],
};

const ASSET_HISTORY: Record<string, { m: string; v: number }[]> = {
  Stocks:        [{ m:"Oct",v:155000},{m:"Nov",v:162000},{m:"Dec",v:168000},{m:"Jan",v:171000},{m:"Feb",v:178000},{m:"Mar",v:185000}],
  "Real Estate": [{ m:"Oct",v:138000},{m:"Nov",v:141000},{m:"Dec",v:144000},{m:"Jan",v:146000},{m:"Feb",v:148000},{m:"Mar",v:150000}],
  Savings:       [{ m:"Oct",v:72000}, {m:"Nov",v:72800}, {m:"Dec",v:73500}, {m:"Jan",v:74000}, {m:"Feb",v:74600}, {m:"Mar",v:75000}],
  Crypto:        [{ m:"Oct",v:28000}, {m:"Nov",v:35000}, {m:"Dec",v:52000}, {m:"Jan",v:48000}, {m:"Feb",v:41000}, {m:"Mar",v:45000}],
  Bonds:         [{ m:"Oct",v:31000}, {m:"Nov",v:31200}, {m:"Dec",v:31500}, {m:"Jan",v:31800}, {m:"Feb",v:32100}, {m:"Mar",v:32500}],
};

// ── helpers ────────────────────────────────────────────────────────────────────

function HistoryChart({ data, color }: { data: { m: string; v: number }[]; color: string }) {
  const W = 300, H = 120, PAD_L = 56, PAD_B = 24, PAD_T = 8, PAD_R = 8;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;

  const vals = data.map(d => d.v);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;

  const pts = data.map((d, i) => ({
    x: PAD_L + (i / (data.length - 1)) * innerW,
    y: PAD_T + (1 - (d.v - min) / range) * innerH,
    ...d,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${pts[pts.length - 1].x},${H - PAD_B} L${pts[0].x},${H - PAD_B} Z`;

  // Y-axis labels (3 ticks)
  const yTicks = [min, min + range / 2, max];

  return (
    <Svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      <Defs>
        <LinearGradient id={`hg_${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <Stop offset="100%" stopColor={color} stopOpacity="0" />
        </LinearGradient>
      </Defs>

      {/* Y-axis gridlines + labels */}
      {yTicks.map((tick, i) => {
        const y = PAD_T + (1 - (tick - min) / range) * innerH;
        return (
          <React.Fragment key={i}>
            <Line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke="#e5e7eb" strokeWidth="1" />
            <SvgText x={PAD_L - 4} y={y + 3} textAnchor="end" fill={C.muted} fontSize="8">
              {tick >= 1000 ? `${Math.round(tick / 1000)}K` : tick}
            </SvgText>
          </React.Fragment>
        );
      })}

      {/* Area + line */}
      <Path d={areaPath} fill={`url(#hg_${color.replace("#", "")})`} />
      <Path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* X-axis labels */}
      {pts.map((p, i) => (
        <SvgText key={i} x={p.x} y={H} textAnchor="middle" fill={C.muted} fontSize="8">{p.m}</SvgText>
      ))}

      {/* Last point dot */}
      <Circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="4" fill={color} stroke="white" strokeWidth="2" />
    </Svg>
  );
}

// ── main component ─────────────────────────────────────────────────────────────

export function AssetDetailSheet({ asset, onClose }: any) {
  type Holding = { ticker: string; name: string; value: number; change: number };
  const assetIcons: Record<string, any> = {
    "Stocks":       TrendingUp,
    "Real Estate":  Home,
    "Savings":      PiggyBank,
    "Crypto":       Bitcoin,
    "Bonds":        ScrollText,
  };
  const Icon = assetIcons[asset.name] ?? TrendingUp;
  const meta = ASSET_META[asset.name] ?? {
    subtitle: "Asset Holding",
    description: "Detailed information about this asset class.",
    diversification: 50,
    liquidity: 50,
  };
  // Use live holdings/history from sandbox (Alpaca) when present, else static data
  const holdings: Holding[] = (asset.holdings && asset.holdings.length > 0) ? asset.holdings : (ASSET_HOLDINGS[asset.name] ?? []);
  const history  = (asset.history && asset.history.length > 0) ? asset.history : (ASSET_HISTORY[asset.name] ?? []);

  const healthLabel = asset.mood === "happy" ? "😊 Healthy" : asset.mood === "worried" ? "😟 At Risk" : "😐 Neutral";
  const monthPct    = asset.month ?? 0;

  return (
    <View style={styles.modalOverlay}>
      {/* Tap outside to close */}
      <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />

      <View style={[styles.modalSheet, { padding: 0, overflow: "hidden", maxHeight: "90%" }]}>

        {/* ── Colorful Header ── */}
        <View style={{ backgroundColor: asset.color, paddingTop: 28, paddingBottom: 24, alignItems: "center" }}>
          {/* Close button */}
          <TouchableOpacity
            onPress={onClose}
            style={{ position: "absolute", top: 14, right: 16, width: 30, height: 30, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 20, fontWeight: "600" }}>✕</Text>
          </TouchableOpacity>

          {/* Icon circle */}
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
            <Icon size={32} color="white" />
          </View>

          <Text style={{ fontSize: 26, fontWeight: "900", color: "white", letterSpacing: -0.5 }}>{asset.name}</Text>
          <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginBottom: 10 }}>{meta.subtitle}</Text>

          {/* Health badge */}
          <View style={{ backgroundColor: "rgba(255,255,255,0.22)", borderRadius: 99, paddingVertical: 4, paddingHorizontal: 14 }}>
            <Text style={{ color: "white", fontSize: 13, fontWeight: "700" }}>{healthLabel}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>

          {/* ── Total Value ── */}
          <View style={{ backgroundColor: "white", borderRadius: 16, padding: 16, marginBottom: 12, borderColor: "rgba(0,0,0,0.07)", borderWidth: 1 }}>
            <Text style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>Total Value</Text>
            <Text style={{ fontSize: 34, fontWeight: "900", color: C.text, letterSpacing: -1 }}>{fmt(asset.value)}</Text>
            <Text style={{ fontSize: 14, color: pctC(monthPct), marginTop: 6, fontWeight: "600" }}>
              {monthPct >= 0 ? "↗" : "↘"} {monthPct >= 0 ? "+" : ""}{monthPct}% this month
            </Text>
          </View>

          {/* ── About ── */}
          <View style={{ backgroundColor: "white", borderRadius: 16, padding: 16, marginBottom: 12, borderColor: "rgba(0,0,0,0.07)", borderWidth: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: C.text, marginBottom: 8 }}>ⓘ  About This Asset</Text>
            <Text style={{ fontSize: 13, color: C.muted, lineHeight: 20 }}>{meta.description}</Text>
          </View>

          {/* ── Performance tiles (use API values when present) ── */}
          <View style={{ backgroundColor: "white", borderRadius: 16, padding: 16, marginBottom: 12, borderColor: "rgba(0,0,0,0.07)", borderWidth: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: C.text, marginBottom: 12 }}>Performance</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {[
                { label: "24H",  value: asset.day ?? 0 },
                { label: "7D",   value: asset.week ?? 0 },
                { label: "1M",   value: asset.month ?? 0 },
                { label: "1Y",   value: asset.year ?? 0 },
              ].map(({ label, value }) => (
                <View key={label} style={{ flex: 1, minWidth: "22%", backgroundColor: "rgba(0,0,0,0.03)", borderRadius: 12, padding: 10, alignItems: "center" }}>
                  <Text style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{label}</Text>
                  <Text style={{ fontSize: 15, fontWeight: "800", color: pctC(value) }}>
                    {value >= 0 ? "+" : ""}{value}%
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── 6-Month History chart ── */}
          {history.length > 1 && (
            <View style={{ backgroundColor: "white", borderRadius: 16, padding: 16, marginBottom: 12, borderColor: "rgba(0,0,0,0.07)", borderWidth: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: C.text, marginBottom: 12 }}>6-Month History</Text>
              <HistoryChart data={history} color={asset.color} />
            </View>
          )}

          {/* ── Asset Health Metrics ── */}
          <View style={{ backgroundColor: "white", borderRadius: 16, padding: 16, marginBottom: 12, borderColor: "rgba(0,0,0,0.07)", borderWidth: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: C.text, marginBottom: 14 }}>Asset Health Metrics</Text>
            {[
              { label: "Diversification", value: meta.diversification, color: asset.color },
              { label: "Liquidity",       value: meta.liquidity,       color: "#10b981"   },
              { label: "Risk Level",      value: asset.risk ?? 50,     color: "#f59e0b"   },
            ].map(({ label, value, color }) => (
              <View key={label} style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                  <Text style={{ fontSize: 13, color: C.text }}>{label}</Text>
                  <Text style={{ fontSize: 13, color: C.muted, fontWeight: "600" }}>{value}%</Text>
                </View>
                <ProgressBar value={value} color={color} height={7} />
              </View>
            ))}
          </View>

          {/* ── Portfolio Allocation ── */}
          <View style={{ backgroundColor: "white", borderRadius: 16, padding: 16, marginBottom: 12, borderColor: "rgba(0,0,0,0.07)", borderWidth: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: C.text, marginBottom: 8 }}>%  Portfolio Allocation</Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 13, color: C.muted }}>Percentage of Total Wealth</Text>
              <Text style={{ fontSize: 28, fontWeight: "900", color: C.text }}>{asset.pct}%</Text>
            </View>
          </View>

          {/* ── Stocks empty hint (Alpaca has no positions yet) ── */}
          {asset.name === "Stocks" && asset.value === 0 && (
            <View style={{ backgroundColor: "rgba(59,130,246,0.08)", borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "rgba(59,130,246,0.2)" }}>
              <Text style={{ fontSize: 13, color: C.text, marginBottom: 4 }}>No stock positions yet</Text>
              <Text style={{ fontSize: 12, color: C.muted }}>Buy stocks in your Alpaca paper account to see them here. Until then, only your brokerage cash appears under Savings.</Text>
            </View>
          )}

          {/* ── Holdings ── */}
          {holdings.length > 0 && (
            <View style={{ backgroundColor: "white", borderRadius: 16, padding: 16, marginBottom: 12, borderColor: "rgba(0,0,0,0.07)", borderWidth: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: C.text, marginBottom: 4 }}>Holdings</Text>
              <Text style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>Individual positions in this asset class</Text>
              {holdings.map((h: Holding, i: number) => (
                <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(0,0,0,0.025)", borderRadius: 12, padding: 12, marginBottom: 8 }}>
                  <View>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: C.text }}>{h.ticker} – {h.name}</Text>
                    <Text style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{fmt(h.value)}</Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: "800", color: pctC(h.change) }}>
                    {h.change >= 0 ? "+" : ""}{h.change}%
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* ── Action Buttons ── */}
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 8 }}>
            <TouchableOpacity style={[styles.primaryButton, { flex: 1, backgroundColor: asset.color, flexDirection: "row", gap: 6 }]}>
              <Text style={{ color: "white", fontSize: 15 }}>$</Text>
              <Text style={styles.primaryButtonText}>Add Funds</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.primaryButton, { flex: 1, backgroundColor: "rgba(0,0,0,0.06)", flexDirection: "row", gap: 6 }]}>
              <Text style={{ fontSize: 15 }}>📅</Text>
              <Text style={{ color: C.text, fontSize: 15, fontWeight: "700" }}>Set Goal</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </View>
    </View>
  );
}
