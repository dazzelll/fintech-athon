import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { C, ASSETS, fmt, pctC } from './constants';
import { Card, Badge, ProgressBar, BackBtn, styles } from './SharedUI';
import { BlobEcosystem } from './BlobEcosystem';
import { Sparkle } from 'lucide-react-native';

// ─── WEALTH BLOB ──────────────────────────────────────────────────────────────
export function WealthBlob({ onBack }: any) {
  return (
    <ScrollView contentContainerStyle={{paddingBottom:100}}>
      <BackBtn onBack={onBack} title="Wealth Blob" subtitle="Your financial health visualized"/>
      <Card style={{marginBottom:12}}>
        <Text style={{fontWeight:"700",fontSize:16,color:C.text,marginBottom:4}}>Overall Health</Text>
        <Text style={{fontSize:12,color:C.muted,marginBottom:12}}>Your blob's mood reflects your wellness</Text>
        <BlobEcosystem assets={ASSETS} onBlobTap={()=>{}}/>
        <View style={{alignItems:"center",marginTop:14}}>
          <Text style={{fontSize:18,fontWeight:"700",color:C.text}}>😊 Happy & Healthy</Text>
          <Text style={{fontSize:13,color:C.muted,marginTop:4}}>Overall Health Score: 75%</Text>
        </View>
      </Card>
      <Card>
        <Text style={{fontWeight:"700",fontSize:16,color:C.text,marginBottom:16}}>Blob Indicators</Text>
        {([
          {icon:"✓",color:"#10b981",title:"High Diversification",sub:"Your 78% diversification keeps your blob smiling"},
          {icon:"!",color:"#f59e0b",title:"Moderate Liquidity",sub:"Consider increasing liquid assets"},
          {icon:"✓",color:"#10b981",title:"Strong Resilience",sub:"Excellent behavioral patterns & discipline"},
        ] as any[]).map((item,i)=>(
          <View key={i} style={{flexDirection:"row",gap:12,marginBottom:i<2?16:0}}>
            <View style={{width:32,height:32,borderRadius:16,backgroundColor:`${item.color}18`,alignItems:"center",justifyContent:"center"}}>
              <Text style={{color:item.color,fontWeight:"800"}}>{item.icon}</Text>
            </View>
            <View style={{flex:1}}>
              <Text style={{fontSize:14,fontWeight:"600",color:C.text}}>{item.title}</Text>
              <Text style={{fontSize:12,color:C.muted}}>{item.sub}</Text>
            </View>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

// ─── EVENT SIMULATOR ──────────────────────────────────────────────────────────
export function EventSimulator({ onBack }: any) {
  const [sel,setSel]=useState("market-crash");
  const [amt,setAmt]=useState("50000");
  const [res,setRes]=useState<any>(null);
  const current=487500;
  const events=[
    {id:"market-crash",label:"Market Crash",emoji:"📉",impact:-1},
    {id:"job-loss",label:"Job Loss",emoji:"💼",impact:-1},
    {id:"medical-emergency",label:"Medical Emergency",emoji:"🏥",impact:-1},
    {id:"major-purchase",label:"Major Purchase",emoji:"🏠",impact:-1},
    {id:"windfall",label:"Windfall",emoji:"💰",impact:1},
    {id:"investment-gain",label:"Investment Gain",emoji:"📈",impact:1},
  ];
  const recs: any={"market-crash":"Stay diversified. Avoid panic selling.","job-loss":"Use emergency fund first. Activate frugal mode.","medical-emergency":"Use HSA if available. Negotiate bills.","major-purchase":"Reassess budget priorities.","windfall":"Diversify across asset classes.","investment-gain":"Rebalance and lock in some gains."};
  const run=()=>{
    const ev=events.find(e=>e.id===sel)!;
    const a=parseFloat(amt)||0;
    const nw=ev.impact<0?current-a:current+a;
    const pct=((nw-current)/current*100).toFixed(1);
    setRes({nw,pct,rec:recs[sel],pos:ev.impact>0});
  };
  return (
    <ScrollView contentContainerStyle={{paddingBottom:100, paddingTop:30}}>
      <BackBtn onBack={onBack} title="Event Simulator" subtitle="Model financial scenarios"/>
      <Card style={{marginBottom:12}}>
        <Text style={{fontWeight:"700",fontSize:16,color:C.text,marginBottom:14}}>Select Event</Text>
        <View style={{flexDirection:"row",flexWrap:"wrap",gap:8}}>
          {events.map(ev=>(
            <TouchableOpacity key={ev.id} onPress={()=>setSel(ev.id)} activeOpacity={0.75}
              style={{backgroundColor:sel===ev.id?`${C.accent}12`:"rgba(0,0,0,0.03)",borderColor:sel===ev.id?C.accent:C.cardBorder,borderWidth:1.5,borderRadius:12,padding:10,flexDirection:"row",alignItems:"center",gap:8,width:"47%"}}>
              <Text style={{fontSize:12,color:sel===ev.id?C.accent:C.muted,fontWeight:sel===ev.id?"700":"500"}}>{ev.emoji} {ev.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>
      <Card style={{marginBottom:12}}>
        <Text style={{fontWeight:"700",fontSize:16,color:C.text,marginBottom:12}}>Event Amount</Text>
        <View style={{flexDirection:"row",alignItems:"center",backgroundColor:"rgba(0,0,0,0.04)",borderColor:C.cardBorder,borderWidth:1,borderRadius:12,paddingHorizontal:14}}>
          <Text style={{color:C.muted,fontSize:16}}>$</Text>
          <TextInput value={amt} onChangeText={setAmt} keyboardType="numeric"
            style={{flex:1,padding:12,color:C.text,fontSize:16,fontWeight:"700"}}/>
        </View>
        <TouchableOpacity onPress={run} style={[styles.primaryButton,{marginTop:14,backgroundColor:undefined}]}>
          <View style={{backgroundColor:"#f59e0b",borderRadius:14,padding:14,alignItems:"center"}}>
            <Text style={styles.primaryButtonText}>⚡ Run Simulation</Text>
          </View>
        </TouchableOpacity>
      </Card>
      {res&&(
        <Card style={{borderColor:res.pos?"#10b98138":"#ef444438",borderWidth:1}}>
          <Text style={{fontWeight:"700",fontSize:16,color:C.text,marginBottom:14}}>Simulation Result</Text>
          <View style={{flexDirection:"row",gap:12,marginBottom:14}}>
            <View style={{flex:1,backgroundColor:"rgba(0,0,0,0.04)",borderRadius:12,padding:14}}>
              <Text style={{fontSize:11,color:C.muted,marginBottom:4}}>Current</Text>
              <Text style={{fontSize:18,fontWeight:"800",color:C.text}}>{fmt(current)}</Text>
            </View>
            <View style={{flex:1,backgroundColor:res.pos?"rgba(16,185,129,0.08)":"rgba(239,68,68,0.08)",borderRadius:12,padding:14}}>
              <Text style={{fontSize:11,color:C.muted,marginBottom:4}}>After Event</Text>
              <Text style={{fontSize:18,fontWeight:"800",color:res.pos?"#10b981":"#ef4444"}}>{fmt(res.nw)}</Text>
            </View>
          </View>
          <Text style={{fontSize:24,fontWeight:"900",color:pctC(parseFloat(res.pct)),textAlign:"center",marginBottom:12}}>
            {parseFloat(res.pct)>=0?"+":""}{res.pct}%
          </Text>
          <View style={{backgroundColor:"rgba(0,0,0,0.04)",borderRadius:12,padding:14}}>
            <Text style={{fontSize:12,color:C.muted,marginBottom:4}}>💡 Recommendation</Text>
            <Text style={{fontSize:13,color:C.text}}>{res.rec}</Text>
          </View>
        </Card>
      )}
    </ScrollView>
  );
}

// ─── MANIFESTATION BOARD ──────────────────────────────────────────────────────
export function ManifestationBoard({ onBack }: any) {
  const [goals,setGoals]=useState([
    {id:"1",title:"House Down Payment",target:100000,current:45000,deadline:"Dec 2026",emoji:"🏠",cat:"purchase"},
    {id:"2",title:"Portfolio $500K",target:500000,current:185000,deadline:"Jun 2028",emoji:"📈",cat:"investment"},
    {id:"3",title:"Emergency Fund",target:60000,current:55000,deadline:"Jun 2026",emoji:"🛡️",cat:"savings"},
  ]);
  const [adding,setAdding]=useState(false);
  const [nt,setNt]=useState(""); const [na,setNa]=useState("");
  const catC: any={purchase:"#10b981",investment:"#3b82f6",savings:"#8b5cf6"};
  const add=()=>{ if(nt&&na){setGoals([...goals,{id:Date.now()+"",title:nt,target:parseFloat(na),current:0,deadline:"2027",emoji:"🎯",cat:"savings"}]);setNt("");setNa("");setAdding(false);}};
  
  return (
    <ScrollView contentContainerStyle={{paddingBottom:100}}>
      <View style={[styles.gradientCard,{backgroundColor:"#7c3aed",marginBottom:12,marginTop:30}]}>
        <Text style={{fontWeight:"800",fontSize:20,color:"white"}}>Manifestation Board</Text>
        <Text style={{fontSize:13,color:"rgba(255,255,255,0.75)",marginTop:4}}>{goals.length} active goals</Text>
      </View>
      {goals.map(g=>{
        const pct=Math.min(100,(g.current/g.target)*100);
        const col=catC[g.cat]||C.accent;
        return (
          <Card key={g.id} style={{marginBottom:12}}>
            <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <View style={{flexDirection:"row",gap:10,alignItems:"center",flex:1}}>
                <Text style={{fontSize:24}}>{g.emoji}</Text>
                <View>
                  <Text style={{fontWeight:"700",fontSize:15,color:C.text}}>{g.title}</Text>
                  <Text style={{fontSize:11,color:C.muted}}>By {g.deadline}</Text>
                </View>
              </View>
              <Badge color={col}>{pct.toFixed(0)}%</Badge>
            </View>
            <View style={{flexDirection:"row",justifyContent:"space-between",marginBottom:8}}>
              <Text style={{fontSize:13,color:C.muted}}>Progress</Text>
              <Text style={{fontSize:13,color:C.text,fontWeight:"600"}}>{fmt(g.current)} / {fmt(g.target)}</Text>
            </View>
            <ProgressBar value={pct} color={col} height={8}/>
            <Text style={{fontSize:12,color:C.muted,marginTop:6}}>{fmt(g.target-g.current)} remaining</Text>
          </Card>
        );
      })}
      {adding?(
        <Card>
          <Text style={{fontWeight:"700",fontSize:15,color:C.text,marginBottom:14}}>New Goal</Text>
          <TextInput placeholder="Goal name..." value={nt} onChangeText={setNt}
            style={styles.input} placeholderTextColor={C.muted}/>
          <TextInput placeholder="Target amount..." keyboardType="numeric" value={na} onChangeText={setNa}
            style={[styles.input,{marginBottom:14}]} placeholderTextColor={C.muted}/>
          <View style={{flexDirection:"row",gap:8}}>
            <TouchableOpacity onPress={add} style={{flex:1,padding:12,backgroundColor:"#8b5cf6",borderRadius:12,alignItems:"center"}}>
              <Text style={{color:"white",fontWeight:"700"}}>Add</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={()=>setAdding(false)} style={{flex:1,padding:12,backgroundColor:"rgba(0,0,0,0.05)",borderRadius:12,alignItems:"center"}}>
              <Text style={{color:C.muted}}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Card>
      ):(
        <TouchableOpacity onPress={()=>setAdding(true)} style={styles.dashedButton}>
          <Text style={{color:C.muted,fontSize:14}}>+ Add New Goal</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

// ─── QUARTERLY WRAPPED ────────────────────────────────────────────────────────
export function QuarterlyWrapped({ onBack }: any) {
  const [slide, setSlide] = useState(0);

  const slides = [
    { bg: "#4f46e5", emoji: "🎉", title: "Q1 2026 Wrapped", sub: "Your wealth journey this quarter" },
    { bg: "#065f46", emoji: "📈", title: "+12.5%",          sub: "Portfolio growth this quarter", stat: "$53,750 gained" },
    { bg: "#1e3a8a", emoji: "🏆", title: "Top Move",        sub: "Stocks led your portfolio",     stat: "+18.4% annual" },
    { bg: "#7c3aed", emoji: "🎯", title: "3 Goals Active",  sub: "On track for all of them",      stat: "Keep going!" },
    { bg: "wealth-age" }, // wealth age slide
  ];

  const s = slides[slide];
  const isWealthAge = (s as any).bg === "wealth-age";

  return (
    <View style={{ flex: 1, backgroundColor: isWealthAge ? "#1e3a8a" : (s as any).bg }}>

      {/* Close button */}
      <TouchableOpacity
        onPress={onBack}
        style={{ position: "absolute", top: 52, right: 20, zIndex: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}
      >
        <Text style={{ color: "white", fontSize: 18, fontWeight: "600" }}>✕</Text>
      </TouchableOpacity>

      {/* Slide content */}
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
        {isWealthAge ? (
          // ── Wealth Age slide ──
          <View style={{ alignItems: "center", width: "100%" }}>
            <Text style={{ fontSize: 80, fontWeight: "900", color: "white", letterSpacing: -4 }}>42</Text>
            <Text style={{ fontSize: 20, color: "rgba(255,255,255,0.75)", marginBottom: 8 }}>Your Wealth Age</Text>
            <View style={{ marginVertical: 20, height: 1, backgroundColor: "rgba(255,255,255,0.2)", width: "80%" }} />
            <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", marginBottom: 32 }}>
              Real Age: <Text style={{ color: "white", fontWeight: "700" }}>35</Text> · 7 years ahead 🚀
            </Text>
            {([
              ["🏦", "Exceptional savings rate",        "Saving at a rate typical of someone aged 42"],
              ["📈", "Investment returns ahead of curve","Portfolio beats most peers your age"],
              ["🛡️", "Strong risk management",          "Behavioral maturity shows in your decisions"],
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
          // ── Regular slides ──
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 72, marginBottom: 24 }}>{(s as any).emoji}</Text>
            <Text style={{ fontSize: 42, fontWeight: "900", color: "white", letterSpacing: -1, marginBottom: 12, textAlign: "center" }}>{(s as any).title}</Text>
            <Text style={{ fontSize: 18, color: "rgba(255,255,255,0.8)", marginBottom: (s as any).stat ? 24 : 0, textAlign: "center" }}>{(s as any).sub}</Text>
            {(s as any).stat && (
              <View style={{ backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 99, paddingVertical: 10, paddingHorizontal: 24 }}>
                <Text style={{ fontSize: 18, fontWeight: "700", color: "white" }}>{(s as any).stat}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Dot indicators */}
      <View style={{ flexDirection: "row", gap: 8, justifyContent: "center", marginBottom: 20 }}>
        {slides.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => setSlide(i)}
            style={{ width: i === slide ? 24 : 8, height: 8, borderRadius: 99, backgroundColor: i === slide ? "white" : "rgba(255,255,255,0.35)" }}
          />
        ))}
      </View>

      {/* Prev / Next */}
      <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 20, paddingBottom: 48 }}>
        <TouchableOpacity
          onPress={() => setSlide(Math.max(0, slide - 1))}
          disabled={slide === 0}
          style={{ flex: 1, padding: 14, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", opacity: slide === 0 ? 0.4 : 1 }}
        >
          <Text style={{ color: "white", fontSize: 15, fontWeight: "600" }}>← Prev</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => slide === slides.length - 1 ? onBack() : setSlide(slide + 1)}
          style={{ flex: 2, padding: 14, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center" }}
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
    <ScrollView contentContainerStyle={{paddingBottom:100}}>
      <BackBtn onBack={onBack} title="Wealth Age" subtitle="How old is your financial life?"/>
      <View style={{backgroundColor:"#1e3a8a",borderRadius:24,padding:36,alignItems:"center",marginBottom:12}}>
        <Text style={{fontSize:72,fontWeight:"900",color:"white",letterSpacing:-4}}>42</Text>
        <Text style={{fontSize:16,color:"rgba(255,255,255,0.75)"}}>Your Wealth Age</Text>
        <View style={{marginVertical:14,height:1,backgroundColor:"rgba(255,255,255,0.2)",width:"100%"}}/>
        <Text style={{fontSize:14,color:"rgba(255,255,255,0.7)"}}>Real Age: <Text style={{color:"white",fontWeight:"700"}}>35</Text> · 7 years ahead 🚀</Text>
      </View>
      <Card>
        <Text style={{fontWeight:"700",fontSize:16,color:C.text,marginBottom:14}}>What This Means</Text>
        {([
          ["🏦","Exceptional savings rate","Saving at a rate typical of someone aged 42"],
          ["📈","Investment returns ahead of curve","Portfolio beats most peers your age"],
          ["🛡️","Strong risk management","Behavioral maturity shows in your decisions"]
        ] as any[]).map(([e,t,s],i)=>(
          <View key={i} style={{flexDirection:"row",gap:12,marginBottom:i<2?16:0}}>
            <Text style={{fontSize:24}}>{e}</Text>
            <View style={{flex:1}}>
              <Text style={{fontSize:14,fontWeight:"600",color:C.text}}>{t}</Text>
              <Text style={{fontSize:12,color:C.muted}}>{s}</Text>
            </View>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

// ─── STREAKS ──────────────────────────────────────────────────────────────────
export function Streaks({ onBack }: any) {
  const streaks=[
    {name:"Daily Savings",current:12,best:45,goal:30,emoji:"💰"},
    {name:"Investment Streak",current:8,best:15,goal:20,emoji:"📈"},
    {name:"Positive P&L",current:23,best:23,goal:30,emoji:"💵"},
    {name:"Learning Streak",current:0,best:7,goal:14,emoji:"📚"},
  ];
  return (
    <ScrollView contentContainerStyle={{paddingBottom:100}}>
      <BackBtn onBack={onBack} title="Streaks" subtitle="Build momentum with daily habits"/>
      <View style={{backgroundColor:"#ea580c",borderRadius:20,padding:20,marginBottom:12}}>
        <View style={{flexDirection:"row",alignItems:"center",gap:10,marginBottom:8}}>
          <Text style={{fontSize:28}}>🔥</Text>
          <Text style={{fontWeight:"800",fontSize:18,color:"white"}}>Total Streak Power</Text>
        </View>
        <Text style={{fontSize:44,fontWeight:"900",color:"white"}}>{streaks.reduce((s,st)=>s+st.current,0)}</Text>
        <Text style={{fontSize:13,color:"rgba(255,255,255,0.7)"}}>Combined streak days</Text>
      </View>
      {streaks.map((s,i)=>{
        const pct=Math.min(100,(s.current/s.goal)*100);
        const col=s.current===0?C.muted:pct>=100?"#10b981":pct>=50?"#f59e0b":C.accent;
        return (
          <Card key={i} style={{marginBottom:12}}>
            <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <View style={{flexDirection:"row",gap:10,alignItems:"center"}}>
                <Text style={{fontSize:24}}>{s.emoji}</Text>
                <View>
                  <Text style={{fontWeight:"700",fontSize:14,color:C.text}}>{s.name}</Text>
                  <Text style={{fontSize:11,color:C.muted}}>Best: {s.best} days</Text>
                </View>
              </View>
              <View style={{alignItems:"flex-end"}}>
                <Text style={{fontSize:26,fontWeight:"900",color:s.current===0?C.muted:"#f97316"}}>{s.current}</Text>
                <Text style={{fontSize:10,color:C.muted}}>of {s.goal}</Text>
              </View>
            </View>
            <ProgressBar value={pct} color={col} height={7}/>
            {s.current===0&&<Text style={{fontSize:11,color:"#ef4444",marginTop:6}}>⚠️ Streak broken — restart today!</Text>}
          </Card>
        );
      })}
    </ScrollView>
  );
}

// ─── CHALLENGES ───────────────────────────────────────────────────────────────
export function Challenges({ onBack }: any) {
  const ch=[
    {id:"1",title:"No-Spend Weekend",desc:"Spend $0 this weekend",reward:50,progress:1,total:2,emoji:"🚫"},
    {id:"2",title:"Invest $500",desc:"Make a $500 investment",reward:100,progress:0,total:1,emoji:"💼"},
    {id:"3",title:"Track Expenses",desc:"Log all transactions for 7 days",reward:75,progress:5,total:7,emoji:"📝"},
    {id:"4",title:"Finance Article",desc:"Complete a daily learning goal",reward:25,progress:1,total:1,emoji:"📚"},
  ];
  return (
    <ScrollView contentContainerStyle={{paddingBottom:100}}>
      <BackBtn onBack={onBack} title="Challenges" subtitle="Level up your finances"/>
      <View style={{backgroundColor:"#d97706",borderRadius:20,padding:20,marginBottom:12}}>
        <Text style={{fontSize:28,marginBottom:8}}>🏆</Text>
        <Text style={{fontWeight:"800",fontSize:18,color:"white"}}>Active Challenges</Text>
        <Text style={{fontSize:13,color:"rgba(255,255,255,0.75)",marginTop:4}}>{ch.length} in progress</Text>
      </View>
      {ch.map(c=>{
        const pct=(c.progress/c.total)*100, done=pct>=100;
        return (
          <Card key={c.id} style={{opacity:done?0.75:1,marginBottom:12}}>
            <View style={{flexDirection:"row",gap:12,alignItems:"flex-start"}}>
              <View style={{width:44,height:44,borderRadius:14,backgroundColor:done?"rgba(16,185,129,0.1)":"rgba(245,158,11,0.1)",alignItems:"center",justifyContent:"center"}}>
                <Text style={{fontSize:22}}>{done?"✅":c.emoji}</Text>
              </View>
              <View style={{flex:1}}>
                <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <Text style={{fontWeight:"700",fontSize:14,color:C.text}}>{c.title}</Text>
                  <Badge color={done?"#10b981":"#f59e0b"}>+{c.reward}pts</Badge>
                </View>
                <Text style={{fontSize:12,color:C.muted,marginBottom:10}}>{c.desc}</Text>
                <ProgressBar value={pct} color={done?"#10b981":"#f59e0b"} height={6}/>
                <Text style={{fontSize:11,color:C.muted,marginTop:5}}>{c.progress}/{c.total} completed</Text>
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
  const [note,setNote]=useState("");
  const refs=[
    {id:"1",date:"Feb 15",tx:"Impulse gadget purchase",amount:1200,emotion:"regret",notes:"Bought latest phone when current one works fine. Classic FOMO spending."},
    {id:"2",date:"Jan 28",tx:"Panic sold stocks during dip",amount:5000,emotion:"learning",notes:"Market dropped 10% and I panicked. Sold at a loss. Market recovered in weeks."},
    {id:"3",date:"Jan 5",tx:"FOMO'd into random crypto",amount:2000,emotion:"learning",notes:"Lost 40% in a week. Research before investing in volatile assets."},
  ];
  return (
    <ScrollView contentContainerStyle={{paddingBottom:100}}>
      <BackBtn onBack={onBack} title="Villain Arc" subtitle="Reflect on financial missteps"/>
      <View style={{backgroundColor:"#6d28d9",borderRadius:20,padding:20,marginBottom:12}}>
        <View style={{flexDirection:"row",alignItems:"center",gap:10,marginBottom:12}}>
          <Text style={{fontSize:24}}>⚠️</Text>
          <Text style={{fontWeight:"800",fontSize:18,color:"white"}}>Financial Reflections</Text>
        </View>
        <View style={{flexDirection:"row",gap:16}}>
          <View>
            <Text style={{fontSize:36,fontWeight:"900",color:"white"}}>{refs.length}</Text>
            <Text style={{fontSize:12,color:"rgba(255,255,255,0.7)"}}>Reflections</Text>
          </View>
          <View>
            <Text style={{fontSize:36,fontWeight:"900",color:"white"}}>{refs.filter(r=>r.emotion==="learning").length}</Text>
            <Text style={{fontSize:12,color:"rgba(255,255,255,0.7)"}}>Learning Moments</Text>
          </View>
        </View>
      </View>
      {refs.map(r=>(
        <Card key={r.id} style={{marginBottom:12}}>
          <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
            <View style={{flex:1}}>
              <Text style={{fontWeight:"700",fontSize:14,color:C.text}}>{r.tx}</Text>
              <Text style={{fontSize:11,color:C.muted}}>{r.date} 2026</Text>
            </View>
            <Badge color={r.emotion==="regret"?"#ef4444":"#3b82f6"}>{r.emotion==="regret"?"😞 Regret":"💡 Learning"}</Badge>
          </View>
          <Text style={{fontSize:14,fontWeight:"700",color:"#ef4444",marginBottom:10}}>-${r.amount.toLocaleString()}</Text>
          <View style={{backgroundColor:"rgba(0,0,0,0.04)",borderRadius:10,padding:12}}>
            <Text style={{fontSize:12,color:C.muted}}>{r.notes}</Text>
          </View>
        </Card>
      ))}
      <Card>
        <Text style={{fontWeight:"700",fontSize:15,color:C.text,marginBottom:12}}>Add New Reflection</Text>
        <TextInput
          value={note} onChangeText={setNote}
          placeholder="What happened? What did you learn?"
          placeholderTextColor={C.muted}
          multiline numberOfLines={4}
          style={[styles.input,{height:100,textAlignVertical:"top",marginBottom:12}]}
        />
        <TouchableOpacity style={{padding:13,backgroundColor:"#6d28d9",borderRadius:12,alignItems:"center"}}>
          <Text style={{color:"white",fontSize:14,fontWeight:"700"}}>Save Reflection</Text>
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );
}

// ─── MENU ─────────────────────────────────────────────────────────────────────
export function Menu({ mode, onModeToggle, onNavigate }: any) {
  const items=[
    {id:"challenges",emoji:"🏆",label:"Challenges"},
    {id:"villain-arc",emoji:"😈",label:"Villain Arc"},
  ];
  return (
    <ScrollView contentContainerStyle={{paddingBottom:100,paddingTop:50}}>
      <Text style={{fontWeight:"800",fontSize:24,color:C.text,marginBottom:10}}>Settings</Text>
      <Card>
        <Text style={{fontWeight:"700",fontSize:12,color:C.muted,marginBottom:12,textTransform:"uppercase",letterSpacing:0.8}}>Account</Text>
        <View style={{flexDirection:"row",alignItems:"center",gap:14}}>
          <View style={{width:48,height:48,borderRadius:24,backgroundColor:"#3b82f6",alignItems:"center",justifyContent:"center"}}>
            <Text style={{fontSize:20}}>👤</Text>
          </View>
          <View>
            <Text style={{fontWeight:"700",fontSize:15,color:C.text}}>Alex Chen</Text>
            <Text style={{fontSize:12,color:C.muted}}>alex@example.com</Text>
          </View>
        </View>
      </Card>
      <Card style={{marginBottom:12}}>
        <Text style={{fontWeight:"700",fontSize:12,color:C.muted,marginBottom:12,textTransform:"uppercase",letterSpacing:0.8}}>Mode</Text>
        <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between"}}>
          <View>
            <Text style={{fontWeight:"700",fontSize:15,color:C.text}}>{mode==="growth"?"📈 Growth Mode":"💰 Frugal Mode"}</Text>
            <Text style={{fontSize:12,color:C.muted}}>{mode==="growth"?"Maximize returns":"Minimize spending"}</Text>
          </View>
          <TouchableOpacity onPress={onModeToggle} style={{backgroundColor:mode==="growth"?C.accent:"#8b5cf6",borderRadius:99,paddingVertical:8,paddingHorizontal:18}}>
            <Text style={{color:"white",fontWeight:"700",fontSize:13}}>Switch</Text>
          </TouchableOpacity>
        </View>
      </Card>
      <Card style={{marginBottom:12}}>
        <Text style={{fontWeight:"700",fontSize:12,color:C.muted,marginBottom:12,textTransform:"uppercase",letterSpacing:0.8}}>Features</Text>
        {items.map(item=>(
          <TouchableOpacity key={item.id} onPress={()=>onNavigate(item.id)}
            style={{paddingVertical:13,flexDirection:"row",alignItems:"center",gap:14,borderBottomColor:C.cardBorder,borderBottomWidth:1}}>
            <Text style={{fontSize:20,width:28}}>{item.emoji}</Text>
            <Text style={{fontSize:15,fontWeight:"500",color:C.text,flex:1}}>{item.label}</Text>
            <Text style={{color:C.muted,fontSize:18}}>›</Text>
          </TouchableOpacity>
        ))}
      </Card>
    </ScrollView>
  );
}