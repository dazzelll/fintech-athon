import React, { useState, useEffect, useRef} from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions, Animated, StyleSheet
} from "react-native";
import { C, ASSETS, fmt, pctC } from "./constants";
import { Card, Badge, ProgressBar, BackBtn, styles } from "./SharedUI";
import { BlobEcosystem } from "./BlobEcosystem";
import {HandCoins, Lightbulb, PiggyBank, PiggyBankIcon} from 'lucide-react-native'
import { Icon } from "expo-router";

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
export function ManifestationBoard({ onBack }: any) {
  const [goals, setGoals] = useState([
    { id:"1", title:"House Down Payment", target:100000, current:45000, deadline:"Dec 2026", emoji:"🏠", cat:"purchase" },
    { id:"2", title:"Portfolio $500K",    target:500000, current:185000, deadline:"Jun 2028", emoji:"📈", cat:"investment" },
    { id:"3", title:"Emergency Fund",     target:60000,  current:55000,  deadline:"Jun 2026", emoji:"🛡️", cat:"savings" },
  ]);
  
  // New Risk Level State: 1 to 10
  const [riskLevel, setRiskLevel]   = useState(5);
  
  const [adding, setAdding]         = useState(false);
  const [nt, setNt]                 = useState("");
  const [na, setNa]                 = useState("");
  const [nd, setNd]                 = useState("2027");
  const [prophecy, setProphecy]     = useState<string | null>(null);
  const [loadingProphecy, setLoadingProphecy] = useState(false);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  
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

  // ── Dynamic Suggestions based on 1-10 Risk Scale ──
  const getSuggestions = (goal: any) => {
    const monthly = ((goal.target - goal.current) / 12).toFixed(0);

    if (riskLevel >= 8) { 
      // HIGH RISK (8-10)
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
      // LOW RISK (1-3)
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
      // MODERATE RISK (4-7)
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
  
      const BACKEND_URL = "http://10.0.2.2:8000/api/manifestation/prophecy";
  
      const res = await fetch(BACKEND_URL, {
        method: "POST",
        headers: {
          "Accept": "application/json", 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({
          // THE FIX: Translate the number into the string the backend expects!
          riskLevel: riskLevel,
          goalsSummary: goalsSummary
        })
      });
  
      const data = await res.json();
      
      console.log("📦 PACKAGE RECEIVED FROM PYTHON:", data);

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
export function VillainArc({ onBack, riskLevel }: any) {
  const [note, setNote]             = useState("");
  const [alerts, setAlerts]         = useState<any[]>([]);
  const [roast, setRoast]           = useState<string | null>(null);
  const [advice, setAdvice]         = useState<string | null>(null);
  const [loading, setLoading]       = useState(false);
  const [caughtIn4K, setCaughtIn4K] = useState<string[]>([]);

  const BACKEND = "http://10.0.2.2:8000";

  // Shared helper — used by both useEffect and the manual button
  // FIX 1: riskLevel goes in the JSON body, not as a query param
  // FIX 2: populate BOTH alerts (for the banner) and roast (for the advisor card)
  const fetchVillainData = async (level: number = riskLevel ?? 5) => {
    try {
      const res = await fetch(`${BACKEND}/api/villain/roast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riskLevel: level }),
      });
      const data = await res.json();
      console.log("📦 FULL API RESPONSE:", JSON.stringify(data, null, 2));

      if (data.alerts && data.alerts.length > 0) {
        setAlerts(data.alerts);
        // Banner gets the problem statement
        setRoast(data.alerts[0].message);
        // Advisor card gets the action steps (separate field from backend)
        setAdvice(data.alerts[0].steps ?? null);
      } else {
        setAlerts([]);
        setRoast(null);
        setAdvice(null);
      }

      if (data.caughtIn4K && data.caughtIn4K.length > 0) {
        setCaughtIn4K(data.caughtIn4K);
      }
    } catch (err) {
      console.error("Villain fetch error:", err);
    }
  };

  // Load on mount / whenever riskLevel changes
  useEffect(() => {
    fetchVillainData(riskLevel);
  }, [riskLevel]);

  // Manual "Get Portfolio Check" button
  // FIX 4: was reading data.roast which doesn't exist — now uses shared helper
  const generateRoast = async () => {
    setLoading(true);
    try {
      await fetchVillainData(riskLevel);
    } catch {
      setRoast("portfolio check is offline rn, try again later");
    }
    setLoading(false);
  };

  const refs = [
    { id:"1", date:"Feb 15", tx:"Impulse gadget purchase",      amount:1200, emotion:"regret",   notes:"Bought latest phone when current one works fine. Classic FOMO spending." },
    { id:"2", date:"Jan 28", tx:"Panic sold stocks during dip", amount:5000, emotion:"learning", notes:"Market dropped 10% and I panicked. Sold at a loss. Market recovered in weeks." },
    { id:"3", date:"Jan 5",  tx:"FOMO'd into random crypto",    amount:2000, emotion:"learning", notes:"Lost 40% in a week. Research before investing in volatile assets." },
  ];

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

      {/* ── Caught in 4K ── */}
      {caughtIn4K.length > 0 && (
        <Card style={{ marginBottom:12, borderColor:"#f59e0b44", borderWidth:1 }}>
          <Text style={{ fontWeight:"800", fontSize:15, color:C.text, marginBottom:12 }}>
            👀 Caught in 4K
          </Text>
          {caughtIn4K.map((item, i) => (
            <View key={i} style={{
              backgroundColor:"rgba(245,158,11,0.08)", borderRadius:12,
              padding:12, marginBottom: i < caughtIn4K.length - 1 ? 8 : 0,
            }}>
              <Text style={{ fontSize:13, color:C.text }}>{item}</Text>
            </View>
          ))}
        </Card>
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
          value={note}
          onChangeText={setNote}
          placeholder="What happened? What did you learn?"
          placeholderTextColor={C.muted}
          multiline
          numberOfLines={4}
          style={[styles.input, { height:100, textAlignVertical:"top", marginBottom:12 }]}
        />
        <TouchableOpacity
          style={{ padding:13, backgroundColor:"#6d28d9", borderRadius:12, alignItems:"center" }}
        >
          <Text style={{ color:"white", fontSize:14, fontWeight:"700" }}>Save Reflection</Text>
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );
}

// ─── MENU ─────────────────────────────────────────────────────────────────────
export function Menu({ mode, onModeToggle, onNavigate }: any) {

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
      <Card style={{ backgroundColor: "#fca5a5" }}>
         <View style={{ flexDirection: "row", alignItems: "center", justifyContent:"center" }}>
          <View>
            <Text style={{ fontWeight: "700", fontSize: 20, color:"white" }}>
              Sign Out
            </Text>
          </View>
        </View>
      </Card>
    </ScrollView>
  );
}
