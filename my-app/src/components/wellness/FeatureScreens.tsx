import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { C, ASSETS, fmt, pctC } from "./constants";
import { Card, Badge, ProgressBar, BackBtn, styles } from "./SharedUI";
import { BlobEcosystem } from "./BlobEcosystem";
import { Sparkle } from "lucide-react-native";

// ─── WEALTH BLOB ──────────────────────────────────────────────────────────────
export function WealthBlob({ onBack }: any) {
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
      <BackBtn
        onBack={onBack}
        title="Wealth Blob"
        subtitle="Your financial health visualized"
      />
      <Card style={{ marginBottom: 12 }}>
        <Text
          style={{
            fontWeight: "700",
            fontSize: 16,
            color: C.text,
            marginBottom: 4,
          }}
        >
          Overall Health
        </Text>
        <Text style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>
          Your blob's mood reflects your wellness
        </Text>
        <BlobEcosystem assets={ASSETS} onBlobTap={() => {}} />
        <View style={{ alignItems: "center", marginTop: 14 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: C.text }}>
            😊 Happy & Healthy
          </Text>
          <Text style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
            Overall Health Score: 75%
          </Text>
        </View>
      </Card>
      <Card>
        <Text
          style={{
            fontWeight: "700",
            fontSize: 16,
            color: C.text,
            marginBottom: 16,
          }}
        >
          Blob Indicators
        </Text>
        {(
          [
            {
              icon: "✓",
              color: "#10b981",
              title: "High Diversification",
              sub: "Your 78% diversification keeps your blob smiling",
            },
            {
              icon: "!",
              color: "#f59e0b",
              title: "Moderate Liquidity",
              sub: "Consider increasing liquid assets",
            },
            {
              icon: "✓",
              color: "#10b981",
              title: "Strong Resilience",
              sub: "Excellent behavioral patterns & discipline",
            },
          ] as any[]
        ).map((item, i) => (
          <View
            key={i}
            style={{
              flexDirection: "row",
              gap: 12,
              marginBottom: i < 2 ? 16 : 0,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: `${item.color}18`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: item.color, fontWeight: "800" }}>
                {item.icon}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: C.text }}>
                {item.title}
              </Text>
              <Text style={{ fontSize: 12, color: C.muted }}>{item.sub}</Text>
            </View>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

// ─── EVENT SIMULATOR ──────────────────────────────────────────────────────────
export function EventSimulator({ onBack }: any) {
  const [sel, setSel] = useState("market-crash");
  const [amt, setAmt] = useState("50000");
  const [res, setRes] = useState<any>(null);
  const current = 487500;
  const events = [
    { id: "market-crash", label: "Market Crash", emoji: "📉", impact: -1 },
    { id: "job-loss", label: "Job Loss", emoji: "💼", impact: -1 },
    {
      id: "medical-emergency",
      label: "Medical Emergency",
      emoji: "🏥",
      impact: -1,
    },
    { id: "major-purchase", label: "Major Purchase", emoji: "🏠", impact: -1 },
    { id: "windfall", label: "Windfall", emoji: "💰", impact: 1 },
    { id: "investment-gain", label: "Investment Gain", emoji: "📈", impact: 1 },
  ];
  const recs: any = {
    "market-crash": "Stay diversified. Avoid panic selling.",
    "job-loss": "Use emergency fund first. Activate frugal mode.",
    "medical-emergency": "Use HSA if available. Negotiate bills.",
    "major-purchase": "Reassess budget priorities.",
    windfall: "Diversify across asset classes.",
    "investment-gain": "Rebalance and lock in some gains.",
  };
  const run = () => {
    const ev = events.find((e) => e.id === sel)!;
    const a = parseFloat(amt) || 0;
    const nw = ev.impact < 0 ? current - a : current + a;
    const pct = (((nw - current) / current) * 100).toFixed(1);
    setRes({ nw, pct, rec: recs[sel], pos: ev.impact > 0 });
  };
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingTop: 30 }}>
      <BackBtn
        onBack={onBack}
        title="Event Simulator"
        subtitle="Model financial scenarios"
      />
      <Card style={{ marginBottom: 12 }}>
        <Text
          style={{
            fontWeight: "700",
            fontSize: 16,
            color: C.text,
            marginBottom: 14,
          }}
        >
          Select Event
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {events.map((ev) => (
            <TouchableOpacity
              key={ev.id}
              onPress={() => setSel(ev.id)}
              activeOpacity={0.75}
              style={{
                backgroundColor:
                  sel === ev.id ? `${C.accent}12` : "rgba(0,0,0,0.03)",
                borderColor: sel === ev.id ? C.accent : C.cardBorder,
                borderWidth: 1.5,
                borderRadius: 12,
                padding: 10,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                width: "47%",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: sel === ev.id ? C.accent : C.muted,
                  fontWeight: sel === ev.id ? "700" : "500",
                }}
              >
                {ev.emoji} {ev.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>
      <Card style={{ marginBottom: 12 }}>
        <Text
          style={{
            fontWeight: "700",
            fontSize: 16,
            color: C.text,
            marginBottom: 12,
          }}
        >
          Event Amount
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.04)",
            borderColor: C.cardBorder,
            borderWidth: 1,
            borderRadius: 12,
            paddingHorizontal: 14,
          }}
        >
          <Text style={{ color: C.muted, fontSize: 16 }}>$</Text>
          <TextInput
            value={amt}
            onChangeText={setAmt}
            keyboardType="numeric"
            style={{
              flex: 1,
              padding: 12,
              color: C.text,
              fontSize: 16,
              fontWeight: "700",
            }}
          />
        </View>
        <TouchableOpacity
          onPress={run}
          style={[
            styles.primaryButton,
            { marginTop: 14, backgroundColor: undefined },
          ]}
        >
          <View
            style={{
              backgroundColor: "#f59e0b",
              borderRadius: 14,
              padding: 14,
              alignItems: "center",
            }}
          >
            <Text style={styles.primaryButtonText}>⚡ Run Simulation</Text>
          </View>
        </TouchableOpacity>
      </Card>
      {res && (
        <Card
          style={{
            borderColor: res.pos ? "#10b98138" : "#ef444438",
            borderWidth: 1,
          }}
        >
          <Text
            style={{
              fontWeight: "700",
              fontSize: 16,
              color: C.text,
              marginBottom: 14,
            }}
          >
            Simulation Result
          </Text>
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 14 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.04)",
                borderRadius: 12,
                padding: 14,
              }}
            >
              <Text style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>
                Current
              </Text>
              <Text style={{ fontSize: 18, fontWeight: "800", color: C.text }}>
                {fmt(current)}
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: res.pos
                  ? "rgba(16,185,129,0.08)"
                  : "rgba(239,68,68,0.08)",
                borderRadius: 12,
                padding: 14,
              }}
            >
              <Text style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>
                After Event
              </Text>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "800",
                  color: res.pos ? "#10b981" : "#ef4444",
                }}
              >
                {fmt(res.nw)}
              </Text>
            </View>
          </View>
          <Text
            style={{
              fontSize: 24,
              fontWeight: "900",
              color: pctC(parseFloat(res.pct)),
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            {parseFloat(res.pct) >= 0 ? "+" : ""}
            {res.pct}%
          </Text>
          <View
            style={{
              backgroundColor: "rgba(0,0,0,0.04)",
              borderRadius: 12,
              padding: 14,
            }}
          >
            <Text style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>
              💡 Recommendation
            </Text>
            <Text style={{ fontSize: 13, color: C.text }}>{res.rec}</Text>
          </View>
        </Card>
      )}
    </ScrollView>
  );
}

// ─── MANIFESTATION BOARD ──────────────────────────────────────────────────────
export function ManifestationBoard({ onBack, mode = "growth" }: any) {
  const [goals, setGoals] = useState([
    { id:"1", title:"House Down Payment", target:100000, current:45000, deadline:"Dec 2026", emoji:"🏠", cat:"purchase" },
    { id:"2", title:"Portfolio $500K",    target:500000, current:185000, deadline:"Jun 2028", emoji:"📈", cat:"investment" },
    { id:"3", title:"Emergency Fund",     target:60000,  current:55000,  deadline:"Jun 2026", emoji:"🛡️", cat:"savings" },
  ]);
  const [adding, setAdding]         = useState(false);
  const [nt, setNt]                 = useState("");
  const [na, setNa]                 = useState("");
  const [nd, setNd]                 = useState("2027");
  const [prophecy, setProphecy]     = useState<string | null>(null);
  const [loadingProphecy, setLoadingProphecy] = useState(false);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  
  // NOTE: The API_KEY is gone! Your frontend is now secure.
  
  const catC: any = { purchase:"#10b981", investment:"#3b82f6", savings:"#8b5cf6" };

  const add = () => {
    if (nt && na) {
      setGoals([...goals, {
        id: Date.now()+"", title: nt, target: parseFloat(na),
        current: 0, deadline: nd, emoji: "🎯", cat: "savings"
      }]);
      setNt(""); setNa(""); setNd("2027"); setAdding(false);
    }
  };

  const getSuggestions = (goal: any) => {
    const monthly = ((goal.target - goal.current) / 12).toFixed(0);
    if (mode === "frugal") {
      return [
        `Cut subscriptions & dining out → redirect $${Math.round(parseFloat(monthly) * 0.4).toLocaleString()}/mo`,
        `Set up auto-transfer of $${monthly}/mo on payday`,
        `Use cash envelopes to limit discretionary spending`,
        `Track every purchase — awareness reduces spending by ~20%`,
      ];
    }
    const suggestions: any = {
      purchase: [
        `Invest $${monthly}/mo in a high-yield account (4.5% APY) to hit target by ${goal.deadline}`,
        `Consider a side income stream — freelancing $500/mo cuts timeline by 8 months`,
        `Automate savings on payday before spending`,
        `Look into first-home buyer grants in your area`,
      ],
      investment: [
        `DCA $${monthly}/mo into index funds (VOO/VTI) for steady compounding`,
        `Rebalance quarterly — don't let any asset exceed 40% allocation`,
        `Reinvest all dividends automatically`,
        `At 7% avg return, you'll hit $500K in ~${Math.round((Math.log(goal.target / goal.current)) / Math.log(1.07))} years`,
      ],
      savings: [
        `Move to a HYSA earning 4.5% — your $${(goal.current/1000).toFixed(0)}K earns $${Math.round(goal.current * 0.045 / 12)}/mo passively`,
        `Top up $${monthly}/mo to reach goal by ${goal.deadline}`,
        `Keep 3-6 months expenses liquid — don't over-save here`,
        `Singapore SSB or T-bills for low-risk yield if timeframe > 6 months`,
      ],
    };
    return suggestions[goal.cat] || suggestions.savings;
  };

  const generateProphecy = async () => {
    setLoadingProphecy(true);
    setProphecy(null);
    try {
      const goalsSummary = goals.map(g =>
        `${g.emoji} ${g.title}: $${g.current.toLocaleString()} of $${g.target.toLocaleString()} by ${g.deadline}`
      ).join(", ");
  
      // IMPORTANT: Update this URL based on how you are running Expo!
      // - If using iOS Simulator: "http://127.0.0.1:8000/api/manifestation/prophecy"
      // - If using Android Emulator: "http://10.0.2.2:8000/api/manifestation/prophecy"
      // - If using a physical phone on Wi-Fi: "http://YOUR_COMPUTER_IP:8000/api/manifestation/prophecy"
      const BACKEND_URL = "http://127.0.0.1:8000/api/manifestation/prophecy";
  
      const res = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: mode,
          goalsSummary: goalsSummary
        })
      });
  
      const data = await res.json();
      
      if (data.success) {
        setProphecy(data.prophecyText);
      } else {
        throw new Error(data.error || "Backend failed to return prophecy");
      }
      
    } catch (err) {                                          
      console.error("Prophecy error:", err);
      setProphecy("The oracle is temporarily blinded... " + String(err));
    }
    setLoadingProphecy(false);
  };
  
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingTop: 30 }}>

      {/* ── Header banner ── */}
      <View style={[styles.gradientCard, { backgroundColor:"#7c3aed", marginBottom:12 }]}>
        <Text style={{ fontWeight:"800", fontSize:24, color:"white" }}>Manifestation Board</Text>
        <Text style={{ fontSize:13, color:"rgba(255,255,255,0.75)", marginTop:4 }}>
          {goals.length} active goals · {mode === "growth" ? "📈 Growth" : "💰 Frugal"} mode
        </Text>
      </View>

      {/* ── The Prophecy ── */}
      <Card style={{ marginBottom:12, borderColor:"#7c3aed44", borderWidth:1.5 }}>
        <View style={{ flexDirection:"row", alignItems:"center", gap:8, marginBottom:8 }}>
          <Text style={{ fontSize:20 }}>🔮</Text>
          <Text style={{ fontWeight:"800", fontSize:15, color:"#7c3aed" }}>The Prophecy</Text>
        </View>
        <Text style={{ fontSize:12, color:C.muted, marginBottom:12 }}>
          Mystical AI-powered predictions based on your goals
        </Text>

        {prophecy ? (
          <View style={{ backgroundColor:"#7c3aed11", borderRadius:12, padding:14, marginBottom:12 }}>
            <Text style={{ fontSize:13, color:C.text, lineHeight:20, fontStyle:"italic" }}>
              "{prophecy}"
            </Text>
          </View>
        ) : (
          <View style={{ backgroundColor:"rgba(0,0,0,0.03)", borderRadius:12, padding:14, marginBottom:12, alignItems:"center" }}>
            <Text style={{ fontSize:13, color:C.muted }}>The oracle awaits your summons...</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={generateProphecy}
          disabled={loadingProphecy}
          style={{ backgroundColor:"#7c3aed", borderRadius:12, padding:13, alignItems:"center" }}
        >
          <Text style={{ color:"white", fontWeight:"700", fontSize:14 }}>
            {loadingProphecy ? "✨ The oracle is speaking..." : "🔮 Consult the Oracle"}
          </Text>
        </TouchableOpacity>
      </Card>

      {/* ── Goals ── */}
      {goals.map(g => {
        const pct = Math.min(100, (g.current / g.target) * 100);
        const col = catC[g.cat] || C.accent;
        const isExpanded = expandedGoal === g.id;
        const suggestions = getSuggestions(g);

        return (
          <Card key={g.id} style={{ marginBottom:12 }}>
            <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
              <View style={{ flexDirection:"row", gap:10, alignItems:"center", flex:1 }}>
                <Text style={{ fontSize:24 }}>{g.emoji}</Text>
                <View style={{ flex:1 }}>
                  <Text style={{ fontWeight:"700", fontSize:15, color:C.text }}>{g.title}</Text>
                  <Text style={{ fontSize:11, color:C.muted }}>By {g.deadline}</Text>
                </View>
              </View>
              <Badge color={col}>{pct.toFixed(0)}%</Badge>
            </View>

            <View style={{ flexDirection:"row", justifyContent:"space-between", marginBottom:8 }}>
              <Text style={{ fontSize:13, color:C.muted }}>Progress</Text>
              <Text style={{ fontSize:13, color:C.text, fontWeight:"600" }}>{fmt(g.current)} / {fmt(g.target)}</Text>
            </View>
            <ProgressBar value={pct} color={col} height={8} />
            <Text style={{ fontSize:12, color:C.muted, marginTop:6, marginBottom:10 }}>{fmt(g.target - g.current)} remaining</Text>

            <TouchableOpacity
              onPress={() => setExpandedGoal(isExpanded ? null : g.id)}
              style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center",
                backgroundColor:`${col}11`, borderRadius:10, padding:10 }}
            >
              <Text style={{ fontSize:13, fontWeight:"700", color:col }}>
                💡 How to achieve this
              </Text>
              <Text style={{ color:col, fontSize:13 }}>{isExpanded ? "▲" : "▼"}</Text>
            </TouchableOpacity>

            {isExpanded && (
              <View style={{ marginTop:10, gap:8 }}>
                {suggestions.map((s: string, i: number) => (
                  <View key={i} style={{ flexDirection:"row", gap:10, alignItems:"flex-start" }}>
                    <View style={{ width:20, height:20, borderRadius:10, backgroundColor:`${col}22`,
                      alignItems:"center", justifyContent:"center", marginTop:1 }}>
                      <Text style={{ fontSize:10, color:col, fontWeight:"700" }}>{i+1}</Text>
                    </View>
                    <Text style={{ fontSize:12, color:C.muted, flex:1, lineHeight:18 }}>{s}</Text>
                  </View>
                ))}
              </View>
            )}
          </Card>
        );
      })}

      {/* ── Add Goal ── */}
      {adding ? (
        <Card>
          <Text style={{ fontWeight:"700", fontSize:15, color:C.text, marginBottom:14 }}>New Goal</Text>
          <TextInput placeholder="Goal name..." value={nt} onChangeText={setNt}
            style={styles.input} placeholderTextColor={C.muted} />
          <TextInput placeholder="Target amount..." keyboardType="numeric" value={na} onChangeText={setNa}
            style={styles.input} placeholderTextColor={C.muted} />
          <TextInput placeholder="Deadline (e.g. Dec 2027)..." value={nd} onChangeText={setNd}
            style={[styles.input, { marginBottom:14 }]} placeholderTextColor={C.muted} />
          <View style={{ flexDirection:"row", gap:8 }}>
            <TouchableOpacity onPress={add}
              style={{ flex:1, padding:12, backgroundColor:"#8b5cf6", borderRadius:12, alignItems:"center" }}>
              <Text style={{ color:"white", fontWeight:"700" }}>Add Goal</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setAdding(false)}
              style={{ flex:1, padding:12, backgroundColor:"rgba(0,0,0,0.05)", borderRadius:12, alignItems:"center" }}>
              <Text style={{ color:C.muted }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Card>
      ) : (
        <TouchableOpacity onPress={() => setAdding(true)} style={styles.dashedButton}>
          <Text style={{ color:C.muted, fontSize:14 }}>+ Add New Goal</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

// ─── QUARTERLY WRAPPED ────────────────────────────────────────────────────────
export function QuarterlyWrapped({ onBack }: any) {
  const [slide, setSlide] = useState(0);

  const slides = [
    {
      bg: "#4f46e5",
      emoji: "🎉",
      title: "Q1 2026 Wrapped",
      sub: "Your wealth journey this quarter",
    },
    {
      bg: "#065f46",
      emoji: "📈",
      title: "+12.5%",
      sub: "Portfolio growth this quarter",
      stat: "$53,750 gained",
    },
    {
      bg: "#1e3a8a",
      emoji: "🏆",
      title: "Top Move",
      sub: "Stocks led your portfolio",
      stat: "+18.4% annual",
    },
    {
      bg: "#7c3aed",
      emoji: "🎯",
      title: "3 Goals Active",
      sub: "On track for all of them",
      stat: "Keep going!",
    },
    { bg: "wealth-age" }, // wealth age slide
  ];

  const s = slides[slide];
  const isWealthAge = (s as any).bg === "wealth-age";

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isWealthAge ? "#1e3a8a" : (s as any).bg,
      }}
    >
      {/* Close button */}
      <TouchableOpacity
        onPress={onBack}
        style={{
          position: "absolute",
          top: 52,
          right: 20,
          zIndex: 10,
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: "rgba(255,255,255,0.2)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "white", fontSize: 18, fontWeight: "600" }}>
          ✕
        </Text>
      </TouchableOpacity>

      {/* Slide content */}
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 32,
        }}
      >
        {isWealthAge ? (
          // ── Wealth Age slide ──
          <View style={{ alignItems: "center", width: "100%" }}>
            <Text
              style={{
                fontSize: 80,
                fontWeight: "900",
                color: "white",
                letterSpacing: -4,
              }}
            >
              42
            </Text>
            <Text
              style={{
                fontSize: 20,
                color: "rgba(255,255,255,0.75)",
                marginBottom: 8,
              }}
            >
              Your Wealth Age
            </Text>
            <View
              style={{
                marginVertical: 20,
                height: 1,
                backgroundColor: "rgba(255,255,255,0.2)",
                width: "80%",
              }}
            />
            <Text
              style={{
                fontSize: 16,
                color: "rgba(255,255,255,0.7)",
                marginBottom: 32,
              }}
            >
              Real Age:{" "}
              <Text style={{ color: "white", fontWeight: "700" }}>35</Text> · 7
              years ahead 🚀
            </Text>
            {(
              [
                [
                  "🏦",
                  "Exceptional savings rate",
                  "Saving at a rate typical of someone aged 42",
                ],
                [
                  "📈",
                  "Investment returns ahead of curve",
                  "Portfolio beats most peers your age",
                ],
                [
                  "🛡️",
                  "Strong risk management",
                  "Behavioral maturity shows in your decisions",
                ],
              ] as any[]
            ).map(([e, t, sub], i) => (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  gap: 14,
                  marginBottom: 18,
                  width: "100%",
                }}
              >
                <Text style={{ fontSize: 26 }}>{e}</Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ fontSize: 15, fontWeight: "700", color: "white" }}
                  >
                    {t}
                  </Text>
                  <Text
                    style={{ fontSize: 13, color: "rgba(255,255,255,0.65)" }}
                  >
                    {sub}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          // ── Regular slides ──
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 72, marginBottom: 24 }}>
              {(s as any).emoji}
            </Text>
            <Text
              style={{
                fontSize: 42,
                fontWeight: "900",
                color: "white",
                letterSpacing: -1,
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              {(s as any).title}
            </Text>
            <Text
              style={{
                fontSize: 18,
                color: "rgba(255,255,255,0.8)",
                marginBottom: (s as any).stat ? 24 : 0,
                textAlign: "center",
              }}
            >
              {(s as any).sub}
            </Text>
            {(s as any).stat && (
              <View
                style={{
                  backgroundColor: "rgba(255,255,255,0.18)",
                  borderRadius: 99,
                  paddingVertical: 10,
                  paddingHorizontal: 24,
                }}
              >
                <Text
                  style={{ fontSize: 18, fontWeight: "700", color: "white" }}
                >
                  {(s as any).stat}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Dot indicators */}
      <View
        style={{
          flexDirection: "row",
          gap: 8,
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        {slides.map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => setSlide(i)}
            style={{
              width: i === slide ? 24 : 8,
              height: 8,
              borderRadius: 99,
              backgroundColor: i === slide ? "white" : "rgba(255,255,255,0.35)",
            }}
          />
        ))}
      </View>

      {/* Prev / Next */}
      <View
        style={{
          flexDirection: "row",
          gap: 10,
          paddingHorizontal: 20,
          paddingBottom: 48,
        }}
      >
        <TouchableOpacity
          onPress={() => setSlide(Math.max(0, slide - 1))}
          disabled={slide === 0}
          style={{
            flex: 1,
            padding: 14,
            borderRadius: 14,
            backgroundColor: "rgba(255,255,255,0.15)",
            alignItems: "center",
            opacity: slide === 0 ? 0.4 : 1,
          }}
        >
          <Text style={{ color: "white", fontSize: 15, fontWeight: "600" }}>
            ← Prev
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            slide === slides.length - 1 ? onBack() : setSlide(slide + 1)
          }
          style={{
            flex: 2,
            padding: 14,
            borderRadius: 14,
            backgroundColor: "rgba(255,255,255,0.25)",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontSize: 15, fontWeight: "700" }}>
            {slide === slides.length - 1 ? "Finish ✓" : "Next →"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── WEALTH AGE ───────────────────────────────────────────────────────────────
export function WealthAge({ onBack }: any) {
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
      <BackBtn
        onBack={onBack}
        title="Wealth Age"
        subtitle="How old is your financial life?"
      />
      <View
        style={{
          backgroundColor: "#1e3a8a",
          borderRadius: 24,
          padding: 36,
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <Text
          style={{
            fontSize: 72,
            fontWeight: "900",
            color: "white",
            letterSpacing: -4,
          }}
        >
          42
        </Text>
        <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.75)" }}>
          Your Wealth Age
        </Text>
        <View
          style={{
            marginVertical: 14,
            height: 1,
            backgroundColor: "rgba(255,255,255,0.2)",
            width: "100%",
          }}
        />
        <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>
          Real Age:{" "}
          <Text style={{ color: "white", fontWeight: "700" }}>35</Text> · 7
          years ahead 🚀
        </Text>
      </View>
      <Card>
        <Text
          style={{
            fontWeight: "700",
            fontSize: 16,
            color: C.text,
            marginBottom: 14,
          }}
        >
          What This Means
        </Text>
        {(
          [
            [
              "🏦",
              "Exceptional savings rate",
              "Saving at a rate typical of someone aged 42",
            ],
            [
              "📈",
              "Investment returns ahead of curve",
              "Portfolio beats most peers your age",
            ],
            [
              "🛡️",
              "Strong risk management",
              "Behavioral maturity shows in your decisions",
            ],
          ] as any[]
        ).map(([e, t, s], i) => (
          <View
            key={i}
            style={{
              flexDirection: "row",
              gap: 12,
              marginBottom: i < 2 ? 16 : 0,
            }}
          >
            <Text style={{ fontSize: 24 }}>{e}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: C.text }}>
                {t}
              </Text>
              <Text style={{ fontSize: 12, color: C.muted }}>{s}</Text>
            </View>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

// ─── STREAKS ──────────────────────────────────────────────────────────────────
export function Streaks({ onBack }: any) {
  const streaks = [
    { name: "Daily Savings", current: 12, best: 45, goal: 30, emoji: "💰" },
    { name: "Investment Streak", current: 8, best: 15, goal: 20, emoji: "📈" },
    { name: "Positive P&L", current: 23, best: 23, goal: 30, emoji: "💵" },
    { name: "Learning Streak", current: 0, best: 7, goal: 14, emoji: "📚" },
  ];
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
      <BackBtn
        onBack={onBack}
        title="Streaks"
        subtitle="Build momentum with daily habits"
      />
      <View
        style={{
          backgroundColor: "#ea580c",
          borderRadius: 20,
          padding: 20,
          marginBottom: 12,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            marginBottom: 8,
          }}
        >
          <Text style={{ fontSize: 28 }}>🔥</Text>
          <Text style={{ fontWeight: "800", fontSize: 18, color: "white" }}>
            Total Streak Power
          </Text>
        </View>
        <Text style={{ fontSize: 44, fontWeight: "900", color: "white" }}>
          {streaks.reduce((s, st) => s + st.current, 0)}
        </Text>
        <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
          Combined streak days
        </Text>
      </View>
      {streaks.map((s, i) => {
        const pct = Math.min(100, (s.current / s.goal) * 100);
        const col =
          s.current === 0
            ? C.muted
            : pct >= 100
            ? "#10b981"
            : pct >= 50
            ? "#f59e0b"
            : C.accent;
        return (
          <Card key={i} style={{ marginBottom: 12 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <View
                style={{ flexDirection: "row", gap: 10, alignItems: "center" }}
              >
                <Text style={{ fontSize: 24 }}>{s.emoji}</Text>
                <View>
                  <Text
                    style={{ fontWeight: "700", fontSize: 14, color: C.text }}
                  >
                    {s.name}
                  </Text>
                  <Text style={{ fontSize: 11, color: C.muted }}>
                    Best: {s.best} days
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text
                  style={{
                    fontSize: 26,
                    fontWeight: "900",
                    color: s.current === 0 ? C.muted : "#f97316",
                  }}
                >
                  {s.current}
                </Text>
                <Text style={{ fontSize: 10, color: C.muted }}>
                  of {s.goal}
                </Text>
              </View>
            </View>
            <ProgressBar value={pct} color={col} height={7} />
            {s.current === 0 && (
              <Text style={{ fontSize: 11, color: "#ef4444", marginTop: 6 }}>
                ⚠️ Streak broken — restart today!
              </Text>
            )}
          </Card>
        );
      })}
    </ScrollView>
  );
}

// ─── CHALLENGES ───────────────────────────────────────────────────────────────
// ─── CHALLENGES ───────────────────────────────────────────────────────────────
export function Challenges({ onBack }: any) {
  const [points, setPoints] = useState(3975);
  const [showLevels, setShowLevels] = useState(false);
  const [ch, setCh] = useState([
    {
      id: "1",
      title: "No-Spend Weekend",
      desc: "Spend $0 this weekend",
      reward: 50,
      progress: 1,
      total: 2,
      emoji: "🚫",
      claimed: false,
    },
    {
      id: "2",
      title: "Invest $500",
      desc: "Make a $500 investment",
      reward: 100,
      progress: 0,
      total: 1,
      emoji: "💼",
      claimed: false,
    },
    {
      id: "3",
      title: "Track Expenses",
      desc: "Log all transactions for 7 days",
      reward: 75,
      progress: 5,
      total: 7,
      emoji: "📝",
      claimed: false,
    },
    {
      id: "4",
      title: "Finance Article",
      desc: "Complete a daily learning goal",
      reward: 25,
      progress: 1,
      total: 1,
      emoji: "📚",
      claimed: false,
    },
    {
      id: "5",
      title: "Save $1,000",
      desc: "Add $1,000 to savings this month",
      reward: 150,
      progress: 0,
      total: 1,
      emoji: "💰",
      claimed: false,
    },
    {
      id: "6",
      title: "No Impulse Buys",
      desc: "Avoid unplanned purchases for 5 days",
      reward: 60,
      progress: 3,
      total: 5,
      emoji: "🧘",
      claimed: false,
    },
  ]);

  // ── Level config ──
  const LEVELS = [
    { name: "Broke Beginner", min: 0, max: 199, color: "#9ca3af", emoji: "🥚" },
    {
      name: "Slightly Less Broke",
      min: 200,
      max: 499,
      color: "#10b981",
      emoji: "🌱",
    },
    {
      name: "Getting Somewhere",
      min: 500,
      max: 999,
      color: "#3b82f6",
      emoji: "⚔️",
    },
    {
      name: "Actually Trying",
      min: 1000,
      max: 1999,
      color: "#8b5cf6",
      emoji: "🛡️",
    },
    {
      name: "Money Master",
      min: 2000,
      max: 3999,
      color: "#f59e0b",
      emoji: "👑",
    },
    {
      name: "Financial Legend",
      min: 4000,
      max: 99999,
      color: "#ef4444",
      emoji: "🔥",
    },
  ];

  const currentLevel = LEVELS.findLast((l) => points >= l.min) ?? LEVELS[0];
  const nextLevel = LEVELS[LEVELS.indexOf(currentLevel) + 1];
  const levelPct = nextLevel
    ? ((points - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100
    : 100;

  const claim = (id: string, reward: number) => {
    setPoints((p) => p + reward);
    setCh((prev) =>
      prev.map((c) => (c.id === id ? { ...c, claimed: true } : c))
    );
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingTop: 30 }}>
      <Text
        style={{
          fontWeight: "800",
          fontSize: 24,
          color: C.text,
          marginBottom: 10,
        }}
      >
        Challenges
      </Text>

      {/* ── Level Card ── */}
      <View
        style={{
          backgroundColor: currentLevel.color,
          borderRadius: 20,
          padding: 20,
          marginBottom: 12,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            position: "absolute",
            top: -30,
            right: -30,
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: "rgba(255,255,255,0.1)",
          }}
        />

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 16,
          }}
        >
          {/* flex:1 + marginRight stops text pushing the points box off screen */}
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.75)",
                marginBottom: 4,
              }}
            >
              Current Level
            </Text>
            <Text
              style={{
                fontSize: 22,
                fontWeight: "900",
                color: "white",
                flexWrap: "wrap",
              }}
            >
              {currentLevel.emoji} {currentLevel.name}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: 16,
              padding: 12,
              alignItems: "center",
              minWidth: 64,
            }}
          >
            <Text style={{ fontSize: 28, fontWeight: "900", color: "white" }}>
              {points}
            </Text>
            <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.8)" }}>
              pts
            </Text>
          </View>
        </View>

        {nextLevel && (
          <>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.75)",
                  flex: 1,
                  marginRight: 8,
                }}
              >
                Progress to {nextLevel.emoji} {nextLevel.name}
              </Text>
              <Text style={{ fontSize: 12, color: "white", fontWeight: "700" }}>
                {nextLevel.min - points} pts
              </Text>
            </View>
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.25)",
                borderRadius: 99,
                height: 8,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  width: `${levelPct}%`,
                  height: 8,
                  backgroundColor: "green",
                  borderRadius: 99,
                }}
              />
            </View>
          </>
        )}
        {!nextLevel && (
          <Text style={{ fontSize: 14, color: "white", fontWeight: "700" }}>
            🎉 Max level reached!
          </Text>
        )}
      </View>

      {/* ── Collapsible All Levels ── */}
      <Card style={{ marginBottom: 20, marginTop: 10 }}>
        <TouchableOpacity
          onPress={() => setShowLevels((s) => !s)}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ fontWeight: "700", fontSize: 15, color: C.text }}>
            All Levels
          </Text>
          <Text style={{ color: C.muted, fontSize: 13 }}>
            {showLevels ? "▲ Hide" : "▼ Show"}
          </Text>
        </TouchableOpacity>
        {showLevels && (
          <View style={{ marginTop: 14 }}>
            {LEVELS.map((l, i) => {
              const unlocked = points >= l.min;
              const isCurrent = l.name === currentLevel.name;
              return (
                <View
                  key={i}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 12,
                    opacity: unlocked ? 1 : 0.4,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: `${l.color}22`,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontSize: 18 }}>{l.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ fontSize: 13, fontWeight: "700", color: C.text }}
                    >
                      {l.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: C.muted }}>
                      {l.min} – {l.max === 99999 ? "∞" : l.max} pts
                    </Text>
                  </View>
                  {isCurrent && <Badge color={l.color}>Current</Badge>}
                  {unlocked && !isCurrent && (
                    <Text style={{ fontSize: 16 }}>✓</Text>
                  )}
                  {!unlocked && (
                    <Text style={{ fontSize: 13, color: C.muted }}>🔒</Text>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </Card>

      {/* ── Challenges ── */}
      <Text
        style={{
          fontWeight: "800",
          fontSize: 17,
          color: C.text,
          marginBottom: 12,
        }}
      >
        Active Challenges
      </Text>
      {ch.map((c) => {
        const pct = (c.progress / c.total) * 100;
        const done = pct >= 100;
        return (
          <Card
            key={c.id}
            style={{ opacity: c.claimed ? 0.6 : 1, marginBottom: 12 }}
          >
            <View
              style={{
                flexDirection: "row",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: c.claimed
                    ? "rgba(16,185,129,0.1)"
                    : done
                    ? "rgba(245,158,11,0.1)"
                    : "rgba(0,0,0,0.05)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 22 }}>
                  {c.claimed ? "✅" : c.emoji}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 4,
                  }}
                >
                  <Text
                    style={{ fontWeight: "700", fontSize: 14, color: C.text }}
                  >
                    {c.title}
                  </Text>
                  <Badge
                    color={c.claimed ? "#10b981" : done ? "#f59e0b" : C.accent}
                  >
                    +{c.reward}pts
                  </Badge>
                </View>
                <Text
                  style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}
                >
                  {c.desc}
                </Text>
                <ProgressBar
                  value={pct}
                  color={c.claimed ? "#10b981" : done ? "#f59e0b" : C.accent}
                  height={6}
                />
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 6,
                  }}
                >
                  <Text style={{ fontSize: 11, color: C.muted }}>
                    {c.progress}/{c.total} completed
                  </Text>
                  {done && !c.claimed && (
                    <TouchableOpacity
                      onPress={() => claim(c.id, c.reward)}
                      style={{
                        backgroundColor: "#f59e0b",
                        borderRadius: 99,
                        paddingVertical: 4,
                        paddingHorizontal: 12,
                      }}
                    >
                      <Text
                        style={{
                          color: "white",
                          fontSize: 12,
                          fontWeight: "700",
                        }}
                      >
                        Claim {c.reward}pts
                      </Text>
                    </TouchableOpacity>
                  )}
                  {c.claimed && (
                    <Text
                      style={{
                        fontSize: 11,
                        color: "#10b981",
                        fontWeight: "700",
                      }}
                    >
                      ✓ Claimed
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </Card>
        );
      })}
    </ScrollView>
  );
}

// ─── VILLAIN ARC ──────────────────────────────────────────────────────────────
export function VillainArc({ onBack }: any) {
  const [note, setNote] = useState("");
  const refs = [
    {
      id: "1",
      date: "Feb 15",
      tx: "Impulse gadget purchase",
      amount: 1200,
      emotion: "regret",
      notes:
        "Bought latest phone when current one works fine. Classic FOMO spending.",
    },
    {
      id: "2",
      date: "Jan 28",
      tx: "Panic sold stocks during dip",
      amount: 5000,
      emotion: "learning",
      notes:
        "Market dropped 10% and I panicked. Sold at a loss. Market recovered in weeks.",
    },
    {
      id: "3",
      date: "Jan 5",
      tx: "FOMO'd into random crypto",
      amount: 2000,
      emotion: "learning",
      notes:
        "Lost 40% in a week. Research before investing in volatile assets.",
    },
  ];
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
      <BackBtn
        onBack={onBack}
        title="Villain Arc"
        subtitle="Reflect on financial missteps"
      />
      <View
        style={{
          backgroundColor: "#6d28d9",
          borderRadius: 20,
          padding: 20,
          marginBottom: 12,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 24 }}>⚠️</Text>
          <Text style={{ fontWeight: "800", fontSize: 18, color: "white" }}>
            Financial Reflections
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 16 }}>
          <View>
            <Text style={{ fontSize: 36, fontWeight: "900", color: "white" }}>
              {refs.length}
            </Text>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
              Reflections
            </Text>
          </View>
          <View>
            <Text style={{ fontSize: 36, fontWeight: "900", color: "white" }}>
              {refs.filter((r) => r.emotion === "learning").length}
            </Text>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
              Learning Moments
            </Text>
          </View>
        </View>
      </View>
      {refs.map((r) => (
        <Card key={r.id} style={{ marginBottom: 12 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 10,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "700", fontSize: 14, color: C.text }}>
                {r.tx}
              </Text>
              <Text style={{ fontSize: 11, color: C.muted }}>
                {r.date} 2026
              </Text>
            </View>
            <Badge color={r.emotion === "regret" ? "#ef4444" : "#3b82f6"}>
              {r.emotion === "regret" ? "😞 Regret" : "💡 Learning"}
            </Badge>
          </View>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "700",
              color: "#ef4444",
              marginBottom: 10,
            }}
          >
            -${r.amount.toLocaleString()}
          </Text>
          <View
            style={{
              backgroundColor: "rgba(0,0,0,0.04)",
              borderRadius: 10,
              padding: 12,
            }}
          >
            <Text style={{ fontSize: 12, color: C.muted }}>{r.notes}</Text>
          </View>
        </Card>
      ))}
      <Card>
        <Text
          style={{
            fontWeight: "700",
            fontSize: 15,
            color: C.text,
            marginBottom: 12,
          }}
        >
          Add New Reflection
        </Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="What happened? What did you learn?"
          placeholderTextColor={C.muted}
          multiline
          numberOfLines={4}
          style={[
            styles.input,
            { height: 100, textAlignVertical: "top", marginBottom: 12 },
          ]}
        />
        <TouchableOpacity
          style={{
            padding: 13,
            backgroundColor: "#6d28d9",
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontSize: 14, fontWeight: "700" }}>
            Save Reflection
          </Text>
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );
}

// ─── MENU ─────────────────────────────────────────────────────────────────────
export function Menu({ mode, onModeToggle, onNavigate }: any) {
  const items = [
    { id: "challenges", emoji: "🏆", label: "Challenges" },
    { id: "villain-arc", emoji: "😈", label: "Villain Arc" },
  ];
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingTop: 30 }}>
      <Text
        style={{
          fontWeight: "800",
          fontSize: 24,
          color: C.text,
          marginBottom: 10,
        }}
      >
        Settings
      </Text>
      <Card>
        <Text
          style={{
            fontWeight: "700",
            fontSize: 12,
            color: C.muted,
            marginBottom: 12,
            textTransform: "uppercase",
            letterSpacing: 0.8,
          }}
        >
          Account
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: "#3b82f6",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 20 }}>👤</Text>
          </View>
          <View>
            <Text style={{ fontWeight: "700", fontSize: 15, color: C.text }}>
              Blob Blobberson
            </Text>
            <Text style={{ fontSize: 12, color: C.muted }}>
              blobby@gmail.com
            </Text>
          </View>
        </View>
      </Card>
      <Card style={{ marginBottom: 12 }}>
        <Text
          style={{
            fontWeight: "700",
            fontSize: 12,
            color: C.muted,
            marginBottom: 12,
            textTransform: "uppercase",
            letterSpacing: 0.8,
          }}
        >
          Mode
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View>
            <Text style={{ fontWeight: "700", fontSize: 15, color: C.text }}>
              {mode === "growth" ? "📈 Growth Mode" : "💰 Frugal Mode"}
            </Text>
            <Text style={{ fontSize: 12, color: C.muted }}>
              {mode === "growth" ? "Maximize returns" : "Minimize spending"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onModeToggle}
            style={{
              backgroundColor: mode === "growth" ? C.accent : "#8b5cf6",
              borderRadius: 99,
              paddingVertical: 8,
              paddingHorizontal: 18,
            }}
          >
            <Text style={{ color: "white", fontWeight: "700", fontSize: 13 }}>
              Switch
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
      <Card style={{ marginBottom: 12 }}>
        <Text
          style={{
            fontWeight: "700",
            fontSize: 12,
            color: C.muted,
            marginBottom: 12,
            textTransform: "uppercase",
            letterSpacing: 0.8,
          }}
        >
          Features
        </Text>
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => onNavigate(item.id)}
            style={{
              paddingVertical: 13,
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              borderBottomColor: C.cardBorder,
              borderBottomWidth: 1,
            }}
          >
            <Text style={{ fontSize: 20, width: 28 }}>{item.emoji}</Text>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "500",
                color: C.text,
                flex: 1,
              }}
            >
              {item.label}
            </Text>
            <Text style={{ color: C.muted, fontSize: 18 }}>›</Text>
          </TouchableOpacity>
        ))}
      </Card>
    </ScrollView>
  );
}
