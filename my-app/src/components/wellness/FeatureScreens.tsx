import React, { useState, useEffect, useRef} from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Animated,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from "react-native";
import { C, ASSETS, fmt, pctC } from "./constants";
import { Card, Badge, ProgressBar, BackBtn, styles } from "./SharedUI";
import { BlobEcosystem } from "./BlobEcosystem";
import { AssetDetailSheet } from "./AssetDetailSheet";
import {HandCoins, Lightbulb, PiggyBank, PiggyBankIcon} from 'lucide-react-native'
import { Icon, useRouter } from "expo-router";
import { API_BASE_URL } from "../../lib/api";
import { 
  ShieldAlert, 
  CreditCard, 
  PlusCircle, 
  LogOut, 
  ChevronRight 
} from 'lucide-react-native';

// ─── WEALTH BLOB ──────────────────────────────────────────────────────────────
export function WealthBlob({ onBack }: any) {
  const [assets, setAssets] = useState(ASSETS);
  const [loading, setLoading] = useState(true);
  const [selAsset, setSelAsset] = useState<any>(null);
  const [health, setHealth] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/portfolio/sandbox`);
        const data = await res.json();
        if (data.assets && Array.isArray(data.assets)) {
          setAssets(data.assets);
        }
        if (data.health && typeof data.health.overall === "number") {
          setHealth(data.health.overall);
        } else {
          setHealth(null);
        }
      } catch (e) {
        console.log("sandbox portfolio fetch failed, using defaults", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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
        {loading ? (
          <View
            style={{
              height: 340,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ActivityIndicator />
          </View>
        ) : (
          <BlobEcosystem assets={assets} onBlobTap={setSelAsset} />
        )}
        <View style={{ alignItems: "center", marginTop: 14 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: C.text }}>
            😊 {health !== null && health >= 80
              ? "Thriving"
              : health !== null && health >= 60
              ? "Happy & Healthy"
              : "Needs Attention"}
          </Text>
          <Text style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
            Overall Health Score:{" "}
            {health !== null ? `${Math.round(health)}%` : "75%"}
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

      {/* Asset detail sheet, wired to the same assets as the blobs */}
      <Modal
        visible={!!selAsset}
        transparent
        animationType="slide"
        onRequestClose={() => setSelAsset(null)}
      >
        {selAsset && (
          <AssetDetailSheet asset={selAsset} onClose={() => setSelAsset(null)} />
        )}
      </Modal>
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
            <Text style={styles.primaryButtonText}>Run Simulation</Text>
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

// ─── MOCK GOALS ───────────────────────────────────────────────────────────────
const MOCK_GOALS = [
  { id:"1", title:"House Down Payment", target:100000, current:45000, deadline:"Dec 2026", emoji:"🏠", cat:"purchase" },
  { id:"2", title:"Portfolio $500K",    target:500000, current:185000, deadline:"Jun 2028", emoji:"📈", cat:"investment" },
  { id:"3", title:"Emergency Fund",     target:60000,  current:55000,  deadline:"Jun 2026", emoji:"🛡️", cat:"savings" },
];

// ─── MANIFESTATION BOARD ──────────────────────────────────────────────────────
export function ManifestationBoard({ onBack }: any) {
  const [goals, setGoals] = useState<any[]>(MOCK_GOALS);
  
  // Risk Level State: 1 to 10
  const [riskLevel, setRiskLevel]   = useState(5);
  
  const [adding, setAdding]         = useState(false);
  const [nt, setNt]                 = useState("");
  const [na, setNa]                 = useState("");
  const [nd, setNd]                 = useState("2027");
  const [prophecy, setProphecy]     = useState<string | null>(null);
  const [loadingProphecy, setLoadingProphecy] = useState(false);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  
  const catC: any = { purchase:"#10b981", investment:"#3b82f6", savings:"#8b5cf6" };

  // Fetch saved goals when the screen loads
  useEffect(() => {
    fetch(`${API_BASE_URL}/goals`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // Map database rows to the frontend format
          const dbGoals = data.map((g: any) => ({
            id: g.id,
            title: g.title,
            target: g.target_amount || 0,
            current: g.current_amount || 0,
            deadline: nd || "2027", // Fallback deadline
            emoji: g.emoji || "🎯",
            cat: g.category || "savings",
          }));
          // Stitch DB goals at the top, mock goals at the bottom
          setGoals([...dbGoals, ...MOCK_GOALS]);
        }
      })
      .catch((err) => console.error("Failed to fetch goals:", err));
  }, []);

  const add = async () => {
    if (nt && na) {
      const targetAmount = parseFloat(na) || 0;
      
      // 1. Instantly show it on screen
      const newGoal = {
        id: Date.now() + "", 
        title: nt, 
        target: targetAmount,
        current: 0, 
        deadline: nd || "2027", 
        emoji: "🎯", 
        cat: "savings"
      };
      setGoals([newGoal, ...goals]);

      // 2. Send it to the Python backend to save permanently
      try {
        await fetch(`${API_BASE_URL}/goals`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: nt,
            target_amount: targetAmount,
            category: "savings",
            emoji: "🎯"
          })
        });
      } catch (err) {
        console.error("Failed to save goal:", err);
      }

      // 3. Clear form
      setNt(""); setNa(""); setNd("2027"); setAdding(false);
    }
  };

  // ── Dynamic Suggestions based on 1-10 Risk Scale ──
  const getSuggestions = (goal: any) => {
    const monthly = ((goal.target - goal.current) / 12).toFixed(0);

    if (riskLevel >= 8) { 
      const agg: any = {
        purchase: [
          `Consider a 5% down payment instead of 20% and invest the rest in high-growth ETFs`,
          `Explore real estate syndications or REITs to accelerate capital generation`,
          `Accept higher debt-to-income limits if it frees up cash for aggressive investing`
        ],
        investment: [
          `Allocate 15-20% to high-conviction crypto or individual tech stocks`,
          `Use LEAPS or options to leverage your $${monthly}/mo contributions`,
          `Accept high volatility: a 30% drop is just a buying opportunity for your timeline`
        ],
        savings: [
          `Keep emergency fund minimal (1-2 months); deploy excess cash into markets`,
          `Use a high-yield crypto staking protocol (USDC) for 8-10% yield on idle cash`,
          `Funnel all side-hustle income directly into high-risk, high-reward plays`
        ]
      };
      return agg[goal.cat] || agg.savings;
    } else if (riskLevel <= 3) { 
      const cons: any = {
        purchase: [
          `Save $${monthly}/mo in a capital-guaranteed CD or T-Bill ladder`,
          `Aim for a 20%+ down payment to minimize mortgage interest risk`,
          `Avoid variable interest rates; lock in a fixed-rate mortgage`
        ],
        investment: [
          `Focus on dividend aristocrats and government bonds (60/40 portfolio)`,
          `Automate $${monthly}/mo into broad, low-volatility ETFs like SCHD`,
          `Capital preservation is key: aim for a steady 4-5% return without the rollercoaster`
        ],
        savings: [
          `Build a robust 6-9 month emergency fund in a top-tier HYSA (4.5% APY)`,
          `Use physical cash envelopes to strictly control outgoing expenses`,
          `Singapore Savings Bonds (SSBs) offer risk-free yield with liquidity`
        ]
      };
      return cons[goal.cat] || cons.savings;
    } else { 
      const mod: any = {
        purchase: [
          `Invest $${monthly}/mo in a 50/50 mix of HYSA and broad index funds`,
          `Automate savings on payday before spending`,
          `Look into first-home buyer grants in your area`
        ],
        investment: [
          `DCA $${monthly}/mo into S&P 500 index funds (VOO/VTI) for steady compounding`,
          `Rebalance quarterly — don't let any asset exceed 40% allocation`,
          `Reinvest all dividends automatically`
        ],
        savings: [
          `Keep 3-4 months expenses liquid, invest the rest`,
          `Move to a HYSA earning 4.5% — your $${(goal.current/1000).toFixed(0)}K earns $${Math.round(goal.current * 0.045 / 12)}/mo passively`,
          `Top up $${monthly}/mo to reach goal by ${goal.deadline}`
        ]
      };
      return mod[goal.cat] || mod.savings;
    }
  };

  const generateProphecy = async () => {
    setLoadingProphecy(true);
    setProphecy(null);
    try {
      const goalsSummary = goals.map(g =>
        `${g.emoji} ${g.title}: $${g.current.toLocaleString()} of $${g.target.toLocaleString()} by ${g.deadline}`
      ).join(", ");

      const res = await fetch(`${API_BASE_URL}/manifestation/prophecy`, {
        method: "POST",
        headers: {
          "Accept": "application/json", 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({
          riskLevel: riskLevel,
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

      {/* ── Header banner with Interactive Risk Slider ── */}
      <View style={[styles.gradientCard, { backgroundColor:"#7c3aed", marginBottom:12 }]}>
        <Text style={{ fontWeight:"800", fontSize:24, color:"white" }}>Manifestation Board</Text>
        <Text style={{ fontSize:13, color:"rgba(255,255,255,0.75)", marginTop:4, marginBottom:16 }}>
          {goals.length} active goals
        </Text>

        {/* Custom Segmented Risk Slider */}
        <View style={{ marginTop: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            <Text style={{ color: "white", fontSize: 13, fontWeight: "600" }}>Risk Tolerance</Text>
            <Text style={{ color: "white", fontSize: 13, fontWeight: "800" }}>{riskLevel} / 10</Text>
          </View>
          
          <View style={{ flexDirection: "row", gap: 4, height: 28 }}>
            {[1,2,3,4,5,6,7,8,9,10].map(level => {
              let color = "#10b981"; 
              if (level > 3) color = "#f59e0b"; 
              if (level > 7) color = "#ef4444"; 
              
              const isActive = level <= riskLevel;
              return (
                <TouchableOpacity
                  key={level}
                  onPress={() => setRiskLevel(level)}
                  style={{ 
                    flex: 1, 
                    backgroundColor: isActive ? color : "rgba(255,255,255,0.15)", 
                    borderRadius: 4,
                  }}
                  activeOpacity={0.8}
                />
              )
            })}
          </View>
          
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, fontWeight: "800", letterSpacing: 0.5 }}>SAFE</Text>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, fontWeight: "800", letterSpacing: 0.5 }}>RISKY</Text>
          </View>
        </View>
      </View>

      {/* ── The Prophecy ── */}
      <Card style={{ marginBottom:12, borderColor:"#7c3aed44", borderWidth:1.5 }}>
        <View style={{ flexDirection:"row", alignItems:"center", gap:8, marginBottom:8 }}>
          <Text style={{ fontSize:20 }}>🔮</Text>
          <Text style={{ fontWeight:"800", fontSize:15, color:"#7c3aed" }}>The Prophecy</Text>
        </View>
        <Text style={{ fontSize:12, color:C.muted, marginBottom:12 }}>
          Mystical AI predictions tailored to a Risk Level of {riskLevel}/10
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
            {loadingProphecy ? "✨ The oracle is speaking..." : "Consult the Oracle"}
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
                💡 {riskLevel >= 8 ? "High-Risk Strategy" : riskLevel <= 3 ? "Safe Strategy" : "Balanced Strategy"}
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
          
          <View style={{
            flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0,0,0,0.04)",
            borderColor: C.cardBorder, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, marginBottom: 8
          }}>
            <Text style={{ color: C.muted, fontSize: 14, marginRight: 4 }}>$</Text>
            <TextInput
              value={na}
              onChangeText={(txt) => setNa(txt.replace(/[^0-9.]/g, ""))}
              keyboardType="numeric"
              placeholder="Target amount..."
              placeholderTextColor={C.muted}
              style={{ flex: 1, fontSize: 15, fontWeight: "700", color: C.text, paddingVertical: 10 }}
            />
          </View>

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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ─── RAINING BACKGROUND COMPONENT ──────────────────────────────────────────────
const RainingBackground = () => {
  const particles = useRef(
    Array.from({ length: 25 }).map(() => ({
      y: new Animated.Value(0),
      x: Math.random() * SCREEN_WIDTH,
      size: Math.random() * 16 + 10, // Random size between 10 and 26
      duration: Math.random() * 5000 + 3000, // Random fall speed (3s to 8s)
      delay: Math.random() * 4000, // Random start delay so they don't fall all at once
      emoji: ["✨", "💰", "📈", "💎", "💸", "✦"][Math.floor(Math.random() * 6)],
    }))
  ).current;

  useEffect(() => {
    particles.forEach((p) => {
      // Loop the falling animation infinitely
      Animated.loop(
        Animated.timing(p.y, {
          toValue: 1,
          duration: p.duration,
          delay: p.delay,
          useNativeDriver: true, // Super important for 60fps smooth falling!
        })
      ).start();
    });
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, i) => (
        <Animated.Text
          key={i}
          style={{
            position: "absolute",
            left: p.x,
            top: -50, // Start slightly above the screen
            fontSize: p.size,
            opacity: 0.15, // Kept subtle so it doesn't distract from the main text
            transform: [
              {
                translateY: p.y.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, SCREEN_HEIGHT + 100], // Fall past the bottom
                }),
              },
            ],
          }}
        >
          {p.emoji}
        </Animated.Text>
      ))}
    </View>
  );
};

// ─── QUARTERLY WRAPPED ────────────────────────────────────────────────────────
export function QuarterlyWrapped({ onBack }: any) {
  const [slide, setSlide] = useState(0);
  const [wrapLoading, setWrapLoading] = useState(true);
  const [wrapTotal, setWrapTotal] = useState<number | null>(null);
  const [wrapAssets, setWrapAssets] = useState<any[]>([]);
  const [wrapHistory, setWrapHistory] = useState<{ m: string; v: number }[]>([]);
  const [caughtIn4K, setCaughtIn4K] = useState<string | null>(null);

  // Setup Animation Values for the Text
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  // Trigger Text Animations whenever the slide changes
  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(40);
    scaleAnim.setValue(0.8);

    Animated.parallel([
      Animated.timing(fadeAnim, { 
        toValue: 1, 
        duration: 500, 
        useNativeDriver: true 
      }),
      Animated.spring(slideAnim, { 
        toValue: 0, 
        friction: 8, 
        tension: 50, 
        useNativeDriver: true 
      }),
      Animated.spring(scaleAnim, { 
        toValue: 1, 
        friction: 5, 
        tension: 60, 
        useNativeDriver: true 
      })
    ]).start();
  }, [slide]);

  // Pull live-ish data so wrapped reflects the current portfolio state
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setWrapLoading(true);
        const res = await fetch(`${API_BASE_URL}/portfolio/sandbox`);
        const data = await res.json();
        if (cancelled) return;
        if (typeof data.total === "number") setWrapTotal(data.total);
        if (Array.isArray(data.assets)) setWrapAssets(data.assets);
        if (Array.isArray(data.history)) setWrapHistory(data.history);
      } catch (e) {
        console.log("wrapped portfolio fetch failed", e);
      } finally {
        if (!cancelled) setWrapLoading(false);
      }
    };

    const loadCaught = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/villain/roast`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ riskLevel: 5 }),
        });
        const data = await res.json();
        const first = Array.isArray(data?.caughtIn4K) ? data.caughtIn4K[0] : null;
        if (!cancelled) setCaughtIn4K(typeof first === "string" ? first : null);
      } catch (e) {
        // ok to ignore
      }
    };

    load();
    loadCaught();
    return () => {
      cancelled = true;
    };
  }, []);

  const money = (n: number) => `$${Math.round(n).toLocaleString()}`;
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3) + 1;
  const year = now.getFullYear();

  const h = wrapHistory || [];
  const start = h.length >= 2 ? Number(h[0]?.v ?? 0) : 0;
  const end = h.length >= 1 ? Number(h[h.length - 1]?.v ?? 0) : (wrapTotal ?? 0);
  const delta = start > 0 ? end - start : 0;
  const growthPct = start > 0 ? (delta / start) * 100 : 0;

  const growthTitle =
    wrapLoading ? "…" : `${growthPct >= 0 ? "+" : ""}${growthPct.toFixed(1)}%`;
  const growthStat =
    wrapLoading || start <= 0
      ? "Updating…"
      : `${delta >= 0 ? money(delta) + " gained" : money(Math.abs(delta)) + " lost"}`;

  const top = (wrapAssets || []).reduce((best: any, a: any) => {
    if (!a || typeof a.pct !== "number") return best;
    if (!best || a.pct > best.pct) return a;
    return best;
  }, null);
  const topSub = top?.name ? `${top.name} led your portfolio` : "Top allocation this quarter";
  const topStat = typeof top?.pct === "number" ? `${top.pct}% allocation` : "—";

  const slides = [
    {
      bg: "#4f46e5",
      emoji: "🎉",
      title: `Q${q} ${year} Wrapped`,
      sub: wrapLoading ? "Pulling your latest snapshot…" : "Your wealth journey this quarter",
    },
    {
      bg: "#065f46",
      emoji: "📈",
      title: growthTitle,
      sub: "Portfolio growth this quarter",
      stat: growthStat,
    },
    {
      bg: "#1e3a8a",
      emoji: "🏆",
      title: "Top Move",
      sub: topSub,
      stat: topStat,
    },
    {
      bg: "#7c3aed",
      emoji: "🎯",
      title: "3 Goals Active",
      sub: "On track for all of them",
      stat: "Keep going!",
    },
    {
      bg: "#4c1d95",
      emoji: "🪞",
      title: "Your Money Mirror",
      sub: "How you actually played this quarter",
      detail:
        "We tracked when you panic sold, FOMO bought, and overconcentrated — so you see patterns, not just your final balance.",
    },
    {
      bg: "#111827",
      emoji: "👀",
      title: "Caught in 4K",
      sub: "Impulsive decisions that quietly taxed your returns",
      detail:
        caughtIn4K
          ? caughtIn4K
          : wrapLoading
          ? "Checking for spicy moments…"
          : "No impulsive moments detected in this snapshot. Clean quarter.",
    },
    {
      bg: "#7c3aed",
      emoji: "⚙️",
      title: "Next‑Quarter Upgrade Plan",
      sub: "Tiny tweaks, big behavioral compounding",
      detail:
        "Try a 24‑hour pause before any fear‑ or hype‑driven trade, cap any single position at a target %, and do a quick monthly reflection tagging decisions as regret vs. learning.",
    },
    { bg: "wealth-age" },
  ];

  const s = slides[slide];
  const isWealthAge = (s as any).bg === "wealth-age";

  return (
    <View style={{ flex: 1, backgroundColor: isWealthAge ? "#1e3a8a" : (s as any).bg }}>
      
      {/* 1. THE RAINING BACKGROUND EFFECT */}
      <RainingBackground />

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
        <Text style={{ color: "white", fontSize: 18, fontWeight: "600" }}>✕</Text>
      </TouchableOpacity>

      {/* Slide content wrapped in Animated.View */}
      <Animated.View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 32,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}
      >
        {isWealthAge ? (
          <View style={{ alignItems: "center", width: "100%" }}>
            <Animated.Text
              style={{
                fontSize: 80,
                fontWeight: "900",
                color: "white",
                letterSpacing: -4,
                transform: [{ scale: scaleAnim }]
              }}
            >
              42
            </Animated.Text>
            
            <Text style={{ fontSize: 20, color: "rgba(255,255,255,0.75)", marginBottom: 8 }}>
              Your Wealth Age
            </Text>
            <View style={{ marginVertical: 20, height: 1, backgroundColor: "rgba(255,255,255,0.2)", width: "80%" }} />
            <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", marginBottom: 32 }}>
              Real Age: <Text style={{ color: "white", fontWeight: "700" }}>35</Text> · 7 years ahead 🚀
            </Text>
            
            {([ 
              ["🏦", "Exceptional savings rate", "Saving at a rate typical of someone aged 42"],
              ["📈", "Investment returns ahead of curve", "Portfolio beats most peers your age"],
              ["🛡️", "Strong risk management", "Behavioral maturity shows in your decisions"],
            ] as any[]).map(([e, t, sub], i) => (
              <View key={i} style={{ flexDirection: "row", gap: 14, marginBottom: 18, width: "100%" }}>
                <Text style={{ fontSize: 26 }}>{e}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: "white" }}>{t}</Text>
                  <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.65)" }}>{sub}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={{ alignItems: "center" }}>
            <Animated.Text style={{ fontSize: 72, marginBottom: 24, transform: [{ scale: scaleAnim }] }}>
              {(s as any).emoji}
            </Animated.Text>

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
                <Text style={{ fontSize: 18, fontWeight: "700", color: "white" }}>
                  {(s as any).stat}
                </Text>
              </View>
            )}
            {(s as any).detail && (
              <Text
                style={{
                  marginTop: 24,
                  color: "rgba(255,255,255,0.85)",
                  fontSize: 14,
                  lineHeight: 22,
                  textAlign: "center",
                }}
              >
                {(s as any).detail}
              </Text>
            )}
          </View>
        )}
      </Animated.View>

      {/* Dot indicators */}
      <View style={{ flexDirection: "row", gap: 8, justifyContent: "center", marginBottom: 20 }}>
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
      <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 20, paddingBottom: 48 }}>
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
          <Text style={{ color: "white", fontSize: 15, fontWeight: "600" }}>← Prev</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => slide === slides.length - 1 ? onBack() : setSlide(slide + 1)}
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
  const [streaks, setStreaks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/streaks`)
      .then(r => r.json())
      .then(data => { setStreaks(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingTop: 30 }}>
      <BackBtn onBack={onBack} title="Streaks" />
      <View style={{ backgroundColor: "#ea580c", borderRadius: 20, padding: 20, marginBottom: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <Text style={{ fontSize: 28 }}>🔥</Text>
          <Text style={{ fontWeight: "800", fontSize: 18, color: "white" }}>Total Streak Power</Text>
        </View>
        <Text style={{ fontSize: 44, fontWeight: "900", color: "white" }}>
          {streaks.reduce((s, st) => s + (st.current || 0), 0)}
        </Text>
        <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>Combined streak days</Text>
      </View>
      {streaks.map((s, i) => {
        const pct = Math.min(100, (s.current / s.goal) * 100);
        const col = s.current === 0 ? C.muted : pct >= 100 ? "#10b981" : pct >= 50 ? "#f59e0b" : C.accent;
        return (
          <Card key={i} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                <Text style={{ fontSize: 24 }}>{s.emoji}</Text>
                <View>
                  <Text style={{ fontWeight: "700", fontSize: 14, color: C.text }}>{s.name}</Text>
                  <Text style={{ fontSize: 11, color: C.muted }}>Best: {s.best} days</Text>
                </View>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ fontSize: 26, fontWeight: "900", color: s.current === 0 ? C.muted : "#f97316" }}>
                  {s.current}
                </Text>
                <Text style={{ fontSize: 10, color: C.muted }}>of {s.goal}</Text>
              </View>
            </View>
            <ProgressBar value={pct} color={col} height={7} />
            {s.current === 0 && (
              <Text style={{ fontSize: 11, color: "#ef4444", marginTop: 6 }}>⚠️ Streak broken — restart today!</Text>
            )}
          </Card>
        );
      })}
    </ScrollView>
  );
}


// ─── MANUAL ASSETS ─────────────────────────────────────────────────────────────
export function ManualAssets({ onBack }: any) {
  const [category, setCategory] = useState<string>("Real Estate & Others");
  const [label, setLabel] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<any[]>([]);

  const categories = [
    "Real Estate & Others",
    "Stocks",
    "Savings",
    "Crypto",
    "Bonds",
  ];

  const loadEntries = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/manual-assets/logs`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setEntries(data);
      } else if (Array.isArray(data.items)) {
        setEntries(data.items);
      }
    } catch (e) {
      console.log("manual assets fetch failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const addEntry = async () => {
    const numeric = parseFloat(amount.replace(/[^0-9.]/g, "")) || 0;
    if (!label || !numeric) return;
    setSaving(true);
    try {
      await fetch(`${API_BASE_URL}/manual-assets/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          label,
          amount: numeric,
        }),
      });
      setLabel("");
      setAmount("");
      await loadEntries();
    } catch (e) {
      console.log("manual asset save failed", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingTop: 30 }}>
      <BackBtn
        onBack={onBack}
        title="Manual Assets"
        subtitle="Real estate & other wealth you track yourself"
      />

      <Card style={{ marginBottom: 12 }}>
        <Text
          style={{
            fontWeight: "700",
            fontSize: 16,
            color: C.text,
            marginBottom: 10,
          }}
        >
          Add to your assets
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: C.muted,
            marginBottom: 14,
          }}
        >
          Log properties, side hustles, private investments, or collectibles so your blobs see the full picture.
        </Text>

        <Text
          style={{
            fontSize: 12,
            color: C.muted,
            marginBottom: 6,
          }}
        >
          Category
        </Text>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 12,
          }}
        >
          {categories.map((cat) => {
            const active = cat === category;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setCategory(cat)}
                activeOpacity={0.75}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: active ? C.accent : C.cardBorder,
                  backgroundColor: active ? `${C.accent}12` : "rgba(0,0,0,0.02)",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    color: active ? C.accent : C.muted,
                    fontWeight: active ? "700" : "500",
                  }}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TextInput
          value={label}
          onChangeText={setLabel}
          placeholder="What is this asset? (e.g. HDB flat, Etsy store, Angel check)"
          placeholderTextColor={C.muted}
          style={[styles.input, { marginBottom: 8 }]}
        />
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.04)",
            borderColor: C.cardBorder,
            borderWidth: 1,
            borderRadius: 12,
            paddingHorizontal: 12,
            marginBottom: 12,
          }}
        >
          <Text style={{ color: C.muted, fontSize: 14, marginRight: 4 }}>$</Text>
          <TextInput
            value={amount}
            onChangeText={(txt) => setAmount(txt.replace(/[^0-9.]/g, ""))}
            keyboardType="numeric"
            placeholder="Estimated value"
            placeholderTextColor={C.muted}
            style={{
              flex: 1,
              fontSize: 15,
              fontWeight: "700",
              color: C.text,
              paddingVertical: 10,
            }}
          />
        </View>
        <TouchableOpacity
          onPress={addEntry}
          disabled={saving}
          style={[
            styles.primaryButton,
            {
              backgroundColor: saving ? "rgba(0,0,0,0.15)" : C.accent,
            },
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {saving ? "Saving..." : "Add to assets"}
          </Text>
        </TouchableOpacity>
      </Card>

      <Card>
        <Text
          style={{
            fontWeight: "700",
            fontSize: 16,
            color: C.text,
            marginBottom: 10,
          }}
        >
          Manual asset history
        </Text>
        {loading ? (
          <View
            style={{
              paddingVertical: 18,
              alignItems: "center",
            }}
          >
            <ActivityIndicator />
          </View>
        ) : entries.length === 0 ? (
          <Text
            style={{
              fontSize: 12,
              color: C.muted,
            }}
          >
            Nothing logged yet. Start by adding your first property, side hustle, or other wealth item.
          </Text>
        ) : (
          entries.map((e, idx) => {
            const dt = e.created_at ? new Date(e.created_at) : null;
            const dateStr = dt
              ? dt.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "";
            return (
              <View
                key={e.id || idx}
                style={{
                  paddingVertical: 10,
                  borderTopWidth: idx === 0 ? 0 : 1,
                  borderColor: "rgba(0,0,0,0.06)",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: C.text,
                    }}
                  >
                    {e.label}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color: C.muted,
                      marginTop: 2,
                    }}
                  >
                    {e.category}
                    {dateStr ? ` · ${dateStr}` : ""}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "800",
                    color: C.text,
                  }}
                >
                  ${Number(e.amount || 0).toLocaleString()}
                </Text>
              </View>
            );
          })
        )}
      </Card>
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
                  backgroundColor: "white",
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
const MOCK_REFS = [
  { id:"mock1", date:"Feb 15", tx:"Impulse gadget purchase", amount:1200, emotion:"regret", notes:"Bought latest phone when current one works fine. Classic FOMO spending." },
  { id:"mock2", date:"Jan 28", tx:"Panic sold stocks during dip", amount:5000, emotion:"learning", notes:"Market dropped 10% and I panicked. Sold at a loss. Market recovered in weeks." },
  { id:"mock3", date:"Jan 5",  tx:"FOMO'd into random crypto", amount:2000, emotion:"learning", notes:"Lost 40% in a week. Research before investing in volatile assets." },
];

export function VillainArc({ onBack, riskLevel }: any) {
  const [txName, setTxName]         = useState("");
  const [txAmount, setTxAmount]     = useState("");
  const [emotion, setEmotion]       = useState<"regret" | "learning">("learning");
  const [note, setNote]             = useState("");
  const [errorMsg, setErrorMsg]     = useState("");

  const [refs, setRefs]             = useState<any[]>([]);
  const [alerts, setAlerts]         = useState<any[]>([]);
  const [roast, setRoast]           = useState<string | null>(null);
  const [advice, setAdvice]         = useState<string | null>(null);
  const [loading, setLoading]       = useState(false);

  // 1) Villain alerts (only when sabotage is active)
  const fetchVillainAlerts = async (level: number = riskLevel ?? 5) => {
    try {
      const res = await fetch(`${API_BASE_URL}/villain/roast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riskLevel: level }),
      });
      const data = await res.json();
      console.log("📦 FULL API RESPONSE:", JSON.stringify(data, null, 2));

      if (data.alerts && data.alerts.length > 0) {
        setAlerts(data.alerts);
      } else {
        setAlerts([]);
      }
    } catch (err) {
      console.error("Villain fetch error:", err);
    }
  };

  // 2) Always-on portfolio advisor (works with or without alerts)
  const fetchAdvisor = async (level: number = riskLevel ?? 5) => {
    try {
      const res = await fetch(`${API_BASE_URL}/villain/advisor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riskLevel: level }),
      });
      const data = await res.json();
      console.log("📦 ADVISOR RESPONSE:", JSON.stringify(data, null, 2));

      if (data && (data.message || data.steps)) {
        setRoast(data.message ?? null);
        setAdvice(data.steps ?? null);
      } else {
        setRoast(null);
        setAdvice(null);
      }
    } catch (err) {
      console.error("Advisor fetch error:", err);
      setRoast(null);
      setAdvice(null);
    }
  };

  // Fetch saved reflections when the screen loads
const fetchRefs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/reflections`);
      const data = await res.json();
      if (Array.isArray(data)) setRefs(data);
    } catch (e) {
      console.error("Reflections fetch error:", e);
    }
  };

  useEffect(() => {
    fetchRefs();
    fetchVillainAlerts(riskLevel);
    fetchAdvisor(riskLevel);
  }, [riskLevel]);

  // Manual "Get Portfolio Check" button
  const generateRoast = async () => {
    setLoading(true);
    try {
      await fetchAdvisor(riskLevel);
    } catch {
      setRoast("portfolio check is offline rn, try again later");
    }
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingTop: 30 }}>
            {/* ── Stats Banner ── */}
            <View style={{ backgroundColor:"#6d28d9", borderRadius:20, padding:20, marginBottom:12 }}>
        <View style={{ flexDirection:"row", alignItems:"center", gap:10, marginBottom:12 }}>
          <Text style={{ fontWeight:"800", fontSize:20, color:"white" }}>Financial Reflections</Text>
        </View>
        <View style={{ flexDirection:"row", gap:24 }}>
          <View>
            <Text style={{ fontSize:36, fontWeight:"900", color:"white" }}>{refs.length}</Text>
            <Text style={{ fontSize:12, color:"rgba(255,255,255,0.7)" }}>Reflections</Text>
          </View>
          <View>
            <Text style={{ fontSize:36, fontWeight:"900", color:"white" }}>
              {refs.filter(r => r.emotion === "learning").length}
            </Text>
            <Text style={{ fontSize:12, color:"rgba(255,255,255,0.7)" }}>Learning Moments</Text>
          </View>
        </View>
      </View>

      {/* ── AI Alert Banner (only shows if sabotage active) ── */}
      {alerts.length > 0 && (
        <View style={{
          backgroundColor: "#3f1d38", borderRadius: 20, padding: 20,
          marginBottom: 12, borderWidth: 1, borderColor: "#be123c",
        }}>
          <View style={{ flexDirection:"row", alignItems:"center", gap:10, marginBottom:6 }}>
            <Text style={{ fontSize: 24 }}>{alerts[0].emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color:"#fda4af", fontWeight:"800", fontSize:12, textTransform:"uppercase" }}>
                Villain Arc Detected 🚨
              </Text>
              <Text style={{ color:"white", fontSize:14, marginTop:4, lineHeight:20 }}>
                {alerts[0].message}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* ── Portfolio Advisor ── */}
      <Card style={{ marginBottom:12 }}>
        <View style={{ flexDirection:"row", alignItems:"center", gap:8, marginBottom:8 }}>
        <Lightbulb size={18} color="#6d28d9" strokeWidth={2.5} />
        <Text style={{fontWeight:"800", fontSize:15, color:"#6d28d9" }}>Portfolio Advisor</Text>
        </View>
        <Text style={{ fontSize:12, color:C.muted, marginBottom:12 }}>
          {alerts.length > 0 ? "Here's how to fix your villain arc 👇" : "Get a reality check on your portfolio"}
        </Text>

        {advice ? (
          <View style={{
            backgroundColor:"#6d28d911", borderRadius:12,
            padding:14, marginBottom:12,
          }}>
            <Text style={{ fontSize:12, color:"#6d28d9", fontWeight:"700", marginBottom:6, textTransform:"uppercase" }}>
              Action Plan
            </Text>
            <Text style={{ fontSize:13, color:C.text, lineHeight:20 }}>
              {advice}
            </Text>
          </View>
        ) : roast ? (
          // Fallback: no separate steps field yet, show roast as advice
          <View style={{
            backgroundColor:"#6d28d911", borderRadius:12,
            padding:14, marginBottom:12,
          }}>
            <Text style={{ fontSize:13, color:C.text, lineHeight:20 }}>
              {roast}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          onPress={generateRoast}
          disabled={loading}
          style={{ backgroundColor:"#6d28d9", borderRadius:12, padding:13, alignItems:"center" }}
        >
          <Text style={{ color:"white", fontWeight:"700", fontSize:14 }}>
            {loading ? "Analyzing..." : "Get Portfolio Check"}
          </Text>
        </TouchableOpacity>
      </Card>

      {/* ── Reflection Cards ── */}
      {refs.map(r => (
        <Card key={r.id} style={{ marginBottom:12 }}>
          <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
            <View style={{ flex:1 }}>
              <Text style={{ fontWeight:"700", fontSize:14, color:C.text }}>{r.tx}</Text>
              <Text style={{ fontSize:11, color:C.muted }}>{r.date} 2026</Text>
            </View>
            <Badge color={r.emotion === "regret" ? "#ef4444" : "#3b82f6"}>
              {r.emotion === "regret" ? "😞 Regret" : "💡 Learning"}
            </Badge>
          </View>
          <Text style={{ fontSize:14, fontWeight:"700", color:"#ef4444", marginBottom:10 }}>
            -${r.amount.toLocaleString()}
          </Text>
          <View style={{ backgroundColor:"rgba(0,0,0,0.04)", borderRadius:10, padding:12 }}>
            <Text style={{ fontSize:12, color:C.muted }}>{r.notes}</Text>
          </View>
        </Card>
      ))}

{/* ── Add Reflection ── */}
<Card>
        <Text style={{ fontWeight:"700", fontSize:15, color:C.text, marginBottom:12 }}>
          Add New Reflection
        </Text>

        <TextInput
          value={txName}
          onChangeText={setTxName}
          placeholder="Event (e.g. Panic sold stocks, Impulse buy)"
          placeholderTextColor={C.muted}
          style={[styles.input, { marginBottom: 8 }]}
        />

        <View style={{
          flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0,0,0,0.04)",
          borderColor: C.cardBorder, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, marginBottom: 12
        }}>
          <Text style={{ color: C.muted, fontSize: 14, marginRight: 4 }}>$</Text>
          <TextInput
            value={txAmount}
            onChangeText={(txt) => setTxAmount(txt.replace(/[^0-9.]/g, ""))}
            keyboardType="numeric"
            placeholder="Amount lost or spent"
            placeholderTextColor={C.muted}
            style={{ flex: 1, fontSize: 15, fontWeight: "700", color: C.text, paddingVertical: 10 }}
          />
        </View>

        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          <TouchableOpacity 
            onPress={() => setEmotion("regret")} 
            style={{ 
              flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 10, borderWidth: 1, 
              borderColor: emotion === "regret" ? "#ef4444" : "transparent", 
              backgroundColor: emotion === "regret" ? "#ef444415" : "rgba(0,0,0,0.03)" 
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "600", color: emotion === "regret" ? "#ef4444" : C.muted }}>😞 Regret</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setEmotion("learning")} 
            style={{ 
              flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 10, borderWidth: 1, 
              borderColor: emotion === "learning" ? "#3b82f6" : "transparent", 
              backgroundColor: emotion === "learning" ? "#3b82f615" : "rgba(0,0,0,0.03)" 
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "600", color: emotion === "learning" ? "#3b82f6" : C.muted }}>💡 Learning</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="What happened? What did you learn?"
          placeholderTextColor={C.muted}
          multiline
          numberOfLines={3}
          style={[styles.input, { height:80, textAlignVertical:"top", marginBottom:12 }]}
        />

        {/* ── ERROR MESSAGE DISPLAY ── */}
        {errorMsg !== "" && (
          <Text style={{ color: "#ef4444", fontSize: 13, marginBottom: 12, fontWeight: "600", textAlign: "center" }}>
            {errorMsg}
          </Text>
        )}

        <TouchableOpacity
          style={{ padding:13, backgroundColor:"#6d28d9", borderRadius:12, alignItems:"center" }}
          onPress={async () => {
            // 1. Validation Check!
            if (!txName.trim() || !txAmount.trim() || !note.trim()) {
              setErrorMsg("⚠️ Please fill up all sections to save your reflection.");
              return; // Stops the function from continuing
            }

            const amountNum = parseFloat(txAmount) || 0;

            // 2. Instantly show it on screen
            try {
              await fetch(`${API_BASE_URL}/reflections`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  txName: txName,
                  amount: amountNum,
                  emotion: emotion,
                  notes: note
                })
              });
              await fetchRefs();  // reload from API so list is accurate
            } catch (err) {
              console.error("Failed to save reflection:", err);
            }
            
            // 4. Clear the form AND the error message
            setTxName(""); 
            setTxAmount(""); 
            setNote(""); 
            setEmotion("learning");
            setErrorMsg(""); 
          }}
        >
          <Text style={{ color:"white", fontSize:14, fontWeight:"700" }}>Save Reflection</Text>
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );
}

// ─── MENU (SETTINGS) ──────────────────────────────────────────────────────────
export function Menu({ mode, onModeToggle, onNavigate }: any) {
  const [maxSpend, setMaxSpend] = useState<string>("20000");
  const [loadingLimit, setLoadingLimit] = useState(true);
  const [savingLimit, setSavingLimit] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const router = useRouter();
  
  const [totalDebt, setTotalDebt] = useState<string>("0");
  const [loadingDebt, setLoadingDebt] = useState(true);
  const [savingDebt, setSavingDebt] = useState(false);
  const [showDebtModal, setShowDebtModal] = useState(false); 

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/settings/spend-threshold`);
        const data = await res.json();
        if (!isMounted) return;
        if (typeof data.max_savings_spend === "number") {
          setMaxSpend(String(Math.round(data.max_savings_spend)));
        }
      } catch (e) {
        console.log("spend threshold fetch failed, using default", e);
      } finally {
        if (isMounted) setLoadingLimit(false);
      }
      try {
        const res2 = await fetch(`${API_BASE_URL}/settings/debt`);
        const data2 = await res2.json();
        if (!isMounted) return;
        if (typeof data2.total_debt === "number") {
          setTotalDebt(String(Math.round(data2.total_debt)));
        }
      } catch (e) {
        console.log("debt fetch failed, using default", e);
      } finally {
        if (isMounted) setLoadingDebt(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const saveLimit = async () => {
    const numeric = parseFloat(maxSpend.replace(/[^0-9.]/g, "")) || 0;
    setSavingLimit(true);
    try {
      await fetch(`${API_BASE_URL}/settings/spend-threshold`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ max_savings_spend: numeric }),
      });
    } catch (e) {
      console.log("spend threshold save failed", e);
    } finally {
      setSavingLimit(false);
    }
  };

  const saveDebt = async () => {
    const numeric = parseFloat(totalDebt.replace(/[^0-9.]/g, "")) || 0;
    setSavingDebt(true);
    try {
      await fetch(`${API_BASE_URL}/settings/debt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ total_debt: numeric }),
      });
    } catch (e) {
      console.log("debt save failed", e);
    } finally {
      setSavingDebt(false);
    }
  };

  const currentLimitDisplay = loadingLimit
    ? "Loading..."
    : `$${Number(maxSpend || "0").toLocaleString()}`;

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingTop: 20 }} showsVerticalScrollIndicator={false}>
      
      {/* ── 1. Profile Header ── */}
      <View style={{ alignItems: 'center', marginBottom: 36, marginTop: 10 }}>
        <View style={{ 
          width: 86, height: 86, borderRadius: 43, backgroundColor: '#3b82f6', 
          alignItems: 'center', justifyContent: 'center', marginBottom: 16,
          shadowColor: '#3b82f6', shadowOffset: {width: 0, height: 6}, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8
        }}>
          <Text style={{ fontSize: 40 }}>👤</Text>
        </View>
        <Text style={{ fontSize: 24, fontWeight: '900', color: C.text, letterSpacing: -0.5 }}>Blob Blobberson</Text>
        <View style={{ backgroundColor: 'rgba(0,0,0,0.04)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, marginTop: 8 }}>
          <Text style={{ fontSize: 13, color: C.muted, fontWeight: '600' }}>blobby@gmail.com</Text>
        </View>
      </View>

      {/* ── 2. Preferences Group ── */}
      <Text style={{ fontSize: 12, fontWeight: '800', color: C.muted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, marginLeft: 8 }}>
        Preferences
      </Text>
      <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
        
        {/* Villain Arc Limit Row */}
        <TouchableOpacity 
          onPress={() => setShowLimitModal(true)} 
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)' }}
        >
          <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: '#8b5cf615', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
            <ShieldAlert size={20} color="#8b5cf6" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: C.text }}>Villain Arc Limit</Text>
            <Text style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Spending trigger threshold</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: C.text, marginRight: 6 }}>{currentLimitDisplay}</Text>
            <ChevronRight size={18} color={C.muted} />
          </View>
        </TouchableOpacity>

        {/* Total Debt Row */}
        <TouchableOpacity 
          onPress={() => setShowDebtModal(true)} 
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}
        >
          <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: '#ef444415', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
            <CreditCard size={20} color="#ef4444" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: C.text }}>Total Debt</Text>
            <Text style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Deducted from gross wealth</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: Number(totalDebt) > 0 ? '#ef4444' : C.text, marginRight: 6 }}>
              {loadingDebt ? "..." : `$${Number(totalDebt || "0").toLocaleString()}`}
            </Text>
            <ChevronRight size={18} color={C.muted} />
          </View>
        </TouchableOpacity>
      </Card>

      {/* ── 3. Portfolio Management Group ── */}
      <Text style={{ fontSize: 12, fontWeight: '800', color: C.muted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, marginLeft: 8 }}>
        Portfolio
      </Text>
      <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 32 }}>
        <TouchableOpacity 
          onPress={() => onNavigate("manual-assets")} 
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}
        >
          <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: '#10b98115', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
            <PlusCircle size={20} color="#10b981" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: C.text }}>Manual Assets</Text>
            <Text style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Log real estate, private equity, etc.</Text>
          </View>
          <ChevronRight size={18} color={C.muted} />
        </TouchableOpacity>
      </Card>

      {/* ── 4. Danger Zone ── */}
      <TouchableOpacity
        onPress={() => router.replace("/login")}
        activeOpacity={0.8}
        style={{ 
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
          padding: 16, backgroundColor: '#ef444410', borderRadius: 16, borderWidth: 1, borderColor: '#ef444430' 
        }}
      >
        <LogOut size={20} color="#ef4444" style={{ marginRight: 8 }} />
        <Text style={{ fontWeight: "700", fontSize: 16, color: "#ef4444" }}>
          Sign Out
        </Text>
      </TouchableOpacity>

      {/* ── Modals (Unchanged from your original code) ── */}
      <Modal visible={showLimitModal} transparent animationType="fade" onRequestClose={() => setShowLimitModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { padding: 20 }]}>
            <Text style={{ fontWeight: "700", fontSize: 16, color: C.text, marginBottom: 8 }}>Adjust villain limit</Text>
            <Text style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>
              How much Savings you're comfortable draining before the villain arc warnings light up.
            </Text>
            <View style={{
              flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0,0,0,0.04)",
              borderColor: C.cardBorder, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 14
            }}>
              <Text style={{ color: C.muted, fontSize: 14, marginRight: 4 }}>$</Text>
              <TextInput
                value={maxSpend}
                onChangeText={(txt) => setMaxSpend(txt.replace(/[^0-9]/g, ""))}
                keyboardType="numeric"
                style={{ flex: 1, fontSize: 15, fontWeight: "700", color: C.text, paddingVertical: 0 }}
                placeholder="20000" placeholderTextColor={C.muted}
              />
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                onPress={async () => { await saveLimit(); setShowLimitModal(false); }}
                disabled={savingLimit || loadingLimit}
                style={[styles.primaryButton, { flex: 1, backgroundColor: savingLimit || loadingLimit ? "rgba(0,0,0,0.1)" : "#8b5cf6" }]}
              >
                <Text style={styles.primaryButtonText}>{savingLimit ? "Saving..." : "Save limit"}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowLimitModal(false)} style={[styles.outlineButton, { flex: 1, marginBottom: 0 }]}>
                <Text style={{ fontSize: 14, color: C.muted, fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showDebtModal} transparent animationType="fade" onRequestClose={() => setShowDebtModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { padding: 20 }]}>
            <Text style={{ fontWeight: "700", fontSize: 16, color: C.text, marginBottom: 8 }}>Total Debt</Text>
            <Text style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>
              Enter your total debt (loans, credit cards, mortgage). This will be subtracted from your gross wealth to show your true net worth.
            </Text>
            <View style={{
              flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0,0,0,0.04)",
              borderColor: C.cardBorder, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 14
            }}>
              <Text style={{ color: C.muted, fontSize: 14, marginRight: 4 }}>$</Text>
              <TextInput
                value={totalDebt}
                onChangeText={(txt) => setTotalDebt(txt.replace(/[^0-9]/g, ""))}
                keyboardType="numeric"
                style={{ flex: 1, fontSize: 15, fontWeight: "700", color: "#ef4444", paddingVertical: 0 }}
                placeholder="0" placeholderTextColor={C.muted}
              />
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                onPress={async () => { await saveDebt(); setShowDebtModal(false); }}
                disabled={savingDebt}
                style={[styles.primaryButton, { flex: 1, backgroundColor: savingDebt ? "rgba(0,0,0,0.1)" : "#ef4444" }]}
              >
                <Text style={styles.primaryButtonText}>{savingDebt ? "Saving..." : "Save debt"}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowDebtModal(false)} style={[styles.outlineButton, { flex: 1, marginBottom: 0 }]}>
                <Text style={{ fontSize: 14, color: C.muted, fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}