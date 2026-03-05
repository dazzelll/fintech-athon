/**
 * WealthWellness — React Native / Expo conversion
 *
 * Dependencies (all included in Expo SDK):
 *   react-native-svg  →  npx expo install react-native-svg
 *
 * Usage in your app (e.g. src/app/index.tsx):
 *   import WealthWellness from '../components/WealthWellness';
 *   export default WealthWellness;
 */

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Platform,
  StatusBar,
  Animated,
} from "react-native";
import Svg, {
  Path,
  Circle,
  Ellipse,
  Text as SvgText,
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
  Rect,
  Pattern,
  Filter,
  FeDropShadow,
} from "react-native-svg";

// ─── Theme ────────────────────────────────────────────────────────────────────
const C = {
  stocks:     "#3b82f6",
  realestate: "#10b981",
  savings:    "#8b5cf6",
  crypto:     "#f59e0b",
  bonds:      "#ec4899",
  bg:         "#f0f4ff",
  card:       "#ffffff",
  cardBorder: "rgba(0,0,0,0.08)",
  text:       "#111827",
  muted:      "#6b7280",
  accent:     "#3b82f6",
};

const ASSETS = [
  { name:"Stocks",      value:185000, pct:38, color:"#3b82f6", emoji:"📈", mood:"happy",   day:0.8,  week:2.3,  month:5.2,  year:18.4, risk:72 },
  { name:"Real Estate", value:150000, pct:31, color:"#10b981", emoji:"🏠", mood:"happy",   day:0.1,  week:0.4,  month:2.1,  year:8.7,  risk:45 },
  { name:"Savings",     value:75000,  pct:15, color:"#8b5cf6", emoji:"💰", mood:"happy",   day:0.01, week:0.05, month:0.4,  year:4.5,  risk:5  },
  { name:"Crypto",      value:45000,  pct:9,  color:"#f59e0b", emoji:"₿",  mood:"worried", day:-2.3, week:-5.8, month:-8.2, year:45.6, risk:95 },
  { name:"Bonds",       value:32500,  pct:7,  color:"#ec4899", emoji:"📜", mood:"neutral", day:0.02, week:0.1,  month:0.8,  year:5.2,  risk:25 },
];

const WEALTH_HISTORY = [
  {m:"Oct",v:445000},{m:"Nov",v:458000},{m:"Dec",v:472000},
  {m:"Jan",v:465000},{m:"Feb",v:480000},{m:"Mar",v:487500},
];

const fmt  = (n: number) => n>=1e6?`$${(n/1e6).toFixed(2)}M`:n>=1000?`$${(n/1000).toFixed(0)}K`:`$${n}`;
const pctC = (v: number) => v>=0?"#10b981":"#ef4444";

function lighten(hex: string, amt: number) {
  const n=parseInt(hex.slice(1),16);
  const r=Math.min(255,((n>>16)&0xff)+Math.round(255*amt));
  const g=Math.min(255,((n>>8)&0xff)+Math.round(255*amt));
  const b=Math.min(255,(n&0xff)+Math.round(255*amt));
  return `rgb(${r},${g},${b})`;
}

// ─── Shared UI ────────────────────────────────────────────────────────────────
function Card({ children, style={}, onPress }: any) {
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.75 : 1}
      onPress={onPress}
      style={[styles.card, style]}
    >
      {children}
    </TouchableOpacity>
  );
}

function ProgressBar({ value, color=C.accent, height=6 }: any) {
  return (
    <View style={{backgroundColor:"rgba(0,0,0,0.07)",borderRadius:99,height,overflow:"hidden"}}>
      <View style={{width:`${Math.min(100,value)}%`,height,backgroundColor:color,borderRadius:99}}/>
    </View>
  );
}

function BackBtn({ onBack, title, subtitle }: any) {
  return (
    <View style={{flexDirection:"row",alignItems:"center",gap:12,marginBottom:20}}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={{color:C.text,fontSize:24,lineHeight:28}}>‹</Text>
      </TouchableOpacity>
      <View>
        <Text style={{fontWeight:"800",fontSize:22,color:C.text}}>{title}</Text>
        {subtitle&&<Text style={{fontSize:13,color:C.muted}}>{subtitle}</Text>}
      </View>
    </View>
  );
}

function Badge({ children, color=C.accent }: any) {
  return (
    <View style={{backgroundColor:`${color}18`,borderColor:`${color}40`,borderWidth:1,borderRadius:99,paddingVertical:3,paddingHorizontal:10}}>
      <Text style={{color,fontSize:12,fontWeight:"700"}}>{children}</Text>
    </View>
  );
}

// ─── Animated Floating Blob ───────────────────────────────────────────────────
const BLOB_LAYOUT=[
  { r:70, x:215, y:75  },
  { r:58, x:90,  y:95  },
  { r:44, x:48,  y:195 },
  { r:36, x:248, y:185 },
  { r:30, x:168, y:198 },
];

function FloatingBlob({ asset, size, x, y, onTap, phase=0 }: any) {
  const tickRef = useRef(phase * 25);
  const [tick, setTick] = useState(phase * 25);

  useEffect(()=>{
    const id = setInterval(()=>{
      tickRef.current += 1;
      setTick(tickRef.current);
    }, 50);
    return ()=>clearInterval(id);
  },[]);

  const t = tick * 0.04;
  const r = size/2-2, cx = size/2, cy = size/2;
  const amps=[0.09,0.07,0.08,0.07,0.09,0.07,0.08,0.07];
  const baseAngles=[0,0.8,1.57,2.36,3.14,3.93,4.71,5.50];
  const baseR=[0.88,0.90,0.88,0.91,0.88,0.90,0.89,0.91];
  const pts=baseAngles.map((a,i)=>{
    const radius=r*(baseR[i]+amps[i]*Math.sin(t+a*1.3+i));
    return [cx+radius*Math.cos(a+t*0.1), cy+radius*Math.sin(a+t*0.1)];
  });

  let d="";
  for(let i=0;i<pts.length;i++){
    const p=pts[i], np=pts[(i+1)%pts.length];
    const cp1=[p[0]+(np[0]-pts[(i-1+pts.length)%pts.length][0])*0.18,
               p[1]+(np[1]-pts[(i-1+pts.length)%pts.length][1])*0.18];
    const cp2=[np[0]-(pts[(i+2)%pts.length][0]-p[0])*0.18,
               np[1]-(pts[(i+2)%pts.length][1]-p[1])*0.18];
    d+=i===0?`M${p[0].toFixed(1)},${p[1].toFixed(1)} `:"";
    d+=`C${cp1[0].toFixed(1)},${cp1[1].toFixed(1)} ${cp2[0].toFixed(1)},${cp2[1].toFixed(1)} ${np[0].toFixed(1)},${np[1].toFixed(1)} `;
  }
  d+="Z";

  const floatY=Math.sin(t*0.8+phase)*5;
  const eyeSize=size*0.17;
  const mthSize=size*0.19;
  const eyeTxt=asset.mood==="happy"?"◕ ◕":asset.mood==="worried"?"⊙ ⊙":"• •";
  const mthTxt=asset.mood==="happy"?"⌣":asset.mood==="worried"?"⌓":"—";
  const gid=`g_${asset.name.replace(/\s/g,"")}`;

  return (
    <TouchableOpacity
      onPress={()=>onTap(asset)}
      style={{position:"absolute", left:x, top:y+floatY, width:size, height:size}}
      activeOpacity={0.8}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <RadialGradient id={gid} cx="36%" cy="30%" r="68%">
            <Stop offset="0%" stopColor={lighten(asset.color,0.38)}/>
            <Stop offset="100%" stopColor={asset.color}/>
          </RadialGradient>
        </Defs>
        <Path d={d} fill={`url(#${gid})`}/>
        <Ellipse
          cx={cx*0.68} cy={cy*0.52} rx={r*0.24} ry={r*0.13}
          fill="rgba(255,255,255,0.48)"
        />
        <SvgText x={cx} y={cy*0.88} fontSize={eyeSize} textAnchor="middle" fill="white" fontWeight="900">{eyeTxt}</SvgText>
        <SvgText x={cx} y={cy*1.22} fontSize={mthSize} textAnchor="middle" fill="white">{mthTxt}</SvgText>
      </Svg>
    </TouchableOpacity>
  );
}

function BlobEcosystem({ assets, onBlobTap }: any) {
  const H=260;
  const W = Dimensions.get("window").width - 64;
  return (
    <View style={{width:"100%",height:H,backgroundColor:"#dce8f8",borderRadius:16,overflow:"hidden"}}>
      {assets.map((asset: any, i: number)=>{
        const l=BLOB_LAYOUT[i];
        const s=l.r*2;
        return (
          <FloatingBlob
            key={asset.name}
            asset={asset}
            size={s}
            x={l.x-l.r}
            y={l.y-l.r}
            onTap={onBlobTap}
            phase={i*0.65}
          />
        );
      })}
      <View style={{position:"absolute",bottom:10,left:0,right:0,alignItems:"center"}}>
        <View style={{backgroundColor:"rgba(255,255,255,0.85)",borderRadius:99,paddingVertical:5,paddingHorizontal:14}}>
          <Text style={{fontSize:11,color:"#4b5563",fontWeight:"500"}}>💡 Blob size = portfolio allocation · Face = risk</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Line Chart ───────────────────────────────────────────────────────────────
function LineChart({ data, color=C.accent }: any) {
  const W=300, H=90;
  const vals=data.map((d: any)=>d.v);
  const min=Math.min(...vals), max=Math.max(...vals);
  const pts=data.map((d: any,i: number)=>({
    x:8+(i/(data.length-1))*(W-16),
    y:H-10-((d.v-min)/(max-min))*(H-22),...d
  }));
  const path=pts.map((p: any,i: number)=>`${i===0?"M":"L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area=`${path} L${pts[pts.length-1].x},${H-2} L${pts[0].x},${H-2} Z`;
  return (
    <Svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{overflow:"visible"}}>
      <Defs>
        <LinearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity="0.15"/>
          <Stop offset="100%" stopColor={color} stopOpacity="0"/>
        </LinearGradient>
      </Defs>
      <Path d={area} fill="url(#lg)"/>
      <Path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      {pts.map((p: any,i: number)=>(
        <SvgText key={i} x={p.x} y={H+3} textAnchor="middle" fill={C.muted} fontSize="9">{p.m}</SvgText>
      ))}
      <Circle cx={pts[pts.length-1].x} cy={pts[pts.length-1].y} r="4" fill={color} stroke="white" strokeWidth="2"/>
    </Svg>
  );
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────
function DonutChart({ assets, size=130 }: any) {
  const cx=size/2, cy=size/2, r=size*0.4, inner=size*0.25;
  let cum=-Math.PI/2;
  const total=assets.reduce((s: number,a: any)=>s+a.value,0);
  const slices=assets.map((a: any)=>{
    const ang=(a.value/total)*2*Math.PI;
    const s2=cum; cum+=ang;
    const x1=cx+r*Math.cos(s2),y1=cy+r*Math.sin(s2);
    const x2=cx+r*Math.cos(cum),y2=cy+r*Math.sin(cum);
    const ix1=cx+inner*Math.cos(cum),iy1=cy+inner*Math.sin(cum);
    const ix2=cx+inner*Math.cos(s2),iy2=cy+inner*Math.sin(s2);
    const lg=ang>Math.PI?1:0;
    return{...a,d:`M${x1},${y1} A${r},${r} 0 ${lg},1 ${x2},${y2} L${ix1},${iy1} A${inner},${inner} 0 ${lg},0 ${ix2},${iy2} Z`};
  });
  return (
    <Svg width={size} height={size}>
      {slices.map((s: any,i: number)=><Path key={i} d={s.d} fill={s.color} opacity="0.88"/>)}
      <Circle cx={cx} cy={cy} r={inner-1} fill="white"/>
      <SvgText x={cx} y={cy-3} textAnchor="middle" fill={C.text} fontSize={12} fontWeight="800">$487K</SvgText>
      <SvgText x={cx} y={cy+11} textAnchor="middle" fill={C.muted} fontSize={9}>Total</SvgText>
    </Svg>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ onNavigate, mode }: any) {
  const [selAsset, setSelAsset] = useState<any>(null);
  return (
    <ScrollView style={{flex:1}} contentContainerStyle={{paddingBottom:100}} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
        <View>
          <Text style={{fontSize:26,fontWeight:"900",color:C.text,letterSpacing:-0.8}}>Wealth Wellness</Text>
          <Text style={{fontSize:13,color:C.muted}}>Your financial health at a glance</Text>
        </View>
        <Badge color={mode==="growth"?C.accent:"#8b5cf6"}>
          {mode==="growth"?"📈 Growth":"💰 Frugal"}
        </Badge>
      </View>

      {/* Blob Ecosystem */}
      <Card style={{padding:16,marginBottom:12}}>
        <Text style={{fontWeight:"700",fontSize:16,color:C.text,marginBottom:2}}>Your Wealth Ecosystem</Text>
        <Text style={{fontSize:12,color:C.muted,marginBottom:12}}>Watch your assets float · Tap to explore</Text>
        <BlobEcosystem assets={ASSETS} onBlobTap={setSelAsset}/>
      </Card>

      {/* Total Wealth */}
      <View style={[styles.gradientCard,{marginBottom:12}]}>
        <View style={styles.gradientCircle}/>
        <Text style={{fontSize:13,color:"rgba(255,255,255,0.75)",marginBottom:4}}>Total Wealth</Text>
        <Text style={{fontSize:42,fontWeight:"900",color:"white",letterSpacing:-2}}>$487,500</Text>
        <Text style={{fontSize:14,color:"#86efac",marginTop:6}}>↑ +12.5% this month</Text>
      </View>

      {/* Quick Actions */}
      <View style={{flexDirection:"row",flexWrap:"wrap",gap:10,marginBottom:12}}>
        {[
          {id:"blob",emoji:"🫧",label:"Wealth Blob"},
          {id:"simulator",emoji:"⚡",label:"Simulate Event"},
          {id:"manifestation",emoji:"🎯",label:"Goals Board"},
          {id:"wrapped",emoji:"🎁",label:"Quarterly Wrap"},
        ].map(item=>(
          <TouchableOpacity key={item.id} onPress={()=>onNavigate(item.id)} style={styles.quickAction} activeOpacity={0.75}>
            <Text style={{fontSize:22}}>{item.emoji}</Text>
            <Text style={{fontSize:12,color:C.muted,fontWeight:"600"}}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Wellness */}
      <Card style={{marginBottom:12}}>
        <Text style={{fontWeight:"700",fontSize:16,color:C.text,marginBottom:4}}>Financial Wellness</Text>
        <Text style={{fontSize:12,color:C.muted,marginBottom:16}}>Key health indicators</Text>
        {([["Diversification",78,C.accent],["Liquidity",65,"#10b981"],["Behavioral Resilience",82,"#8b5cf6"]] as any[]).map(([label,val,color])=>(
          <View key={label} style={{marginBottom:14}}>
            <View style={{flexDirection:"row",justifyContent:"space-between",marginBottom:6}}>
              <Text style={{fontSize:13,color:C.text}}>{label}</Text>
              <Text style={{fontSize:13,color:C.muted,fontWeight:"600"}}>{val}%</Text>
            </View>
            <ProgressBar value={val} color={color} height={7}/>
          </View>
        ))}
      </Card>

      {/* Asset Breakdown */}
      <Card style={{marginBottom:12}}>
        <Text style={{fontWeight:"700",fontSize:16,color:C.text,marginBottom:4}}>Asset Breakdown</Text>
        <Text style={{fontSize:12,color:C.muted,marginBottom:14}}>Tap any asset for details</Text>
        <View style={{alignItems:"center",marginBottom:14}}>
          <DonutChart assets={ASSETS}/>
        </View>
        <View style={{flexDirection:"row",flexWrap:"wrap",gap:8}}>
          {ASSETS.map(a=>(
            <TouchableOpacity key={a.name} onPress={()=>setSelAsset(a)} activeOpacity={0.75}
              style={{backgroundColor:`${a.color}0e`,borderColor:`${a.color}2e`,borderWidth:1,borderRadius:12,padding:10,flexDirection:"row",alignItems:"center",gap:8,width:"47%"}}>
              <Text style={{fontSize:18}}>{a.emoji}</Text>
              <View>
                <Text style={{fontSize:12,color:C.text,fontWeight:"700"}}>{a.name}</Text>
                <Text style={{fontSize:11,color:C.muted}}>{fmt(a.value)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Trajectory */}
      <Card style={{marginBottom:12}}>
        <Text style={{fontWeight:"700",fontSize:16,color:C.text,marginBottom:4}}>6-Month Trajectory</Text>
        <Text style={{fontSize:12,color:C.muted,marginBottom:12}}>Portfolio growth over time</Text>
        <LineChart data={WEALTH_HISTORY}/>
      </Card>

      {/* Mini Stats */}
      <View style={{flexDirection:"row",gap:10,marginBottom:12}}>
        {[
          {id:"wealth-age",emoji:"🕐",label:"Wealth Age",value:"42",sub:"vs Real Age: 35"},
          {id:"streaks",   emoji:"🔥",label:"Streaks",   value:"12 🔥",sub:"Days saving"},
        ].map(item=>(
          <TouchableOpacity key={item.id} onPress={()=>onNavigate(item.id)} style={[styles.card,{flex:1,marginBottom:0}]} activeOpacity={0.75}>
            <Text style={{fontSize:22,marginBottom:6}}>{item.emoji}</Text>
            <Text style={{fontWeight:"600",fontSize:12,color:C.muted}}>{item.label}</Text>
            <Text style={{fontSize:26,fontWeight:"900",color:C.text}}>{item.value}</Text>
            <Text style={{fontSize:11,color:C.muted}}>{item.sub}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity onPress={()=>onNavigate("challenges")} style={styles.outlineButton}>
        <Text style={{color:C.text,fontSize:14,fontWeight:"600"}}>🎯 View Financial Challenges</Text>
      </TouchableOpacity>

      {/* Asset Detail Modal */}
      <Modal visible={!!selAsset} transparent animationType="slide" onRequestClose={()=>setSelAsset(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={()=>setSelAsset(null)}>
          <TouchableOpacity activeOpacity={1} style={styles.modalSheet} onPress={()=>{}}>
            {selAsset&&(
              <ScrollView>
                <View style={{flexDirection:"row",alignItems:"center",gap:12,marginBottom:20}}>
                  <View style={{width:52,height:52,borderRadius:16,backgroundColor:`${selAsset.color}18`,alignItems:"center",justifyContent:"center"}}>
                    <Text style={{fontSize:28}}>{selAsset.emoji}</Text>
                  </View>
                  <View style={{flex:1}}>
                    <Text style={{fontWeight:"800",fontSize:20,color:C.text}}>{selAsset.name}</Text>
                    <Text style={{fontSize:13,color:C.muted}}>{selAsset.pct}% of portfolio</Text>
                  </View>
                  <View style={{alignItems:"flex-end"}}>
                    <Text style={{fontWeight:"800",fontSize:20,color:C.text}}>{fmt(selAsset.value)}</Text>
                    <Text style={{fontSize:12,color:pctC(selAsset.month)}}>{selAsset.month>=0?"+":""}{selAsset.month}% / mo</Text>
                  </View>
                </View>
                {([["Day",selAsset.day],["Week",selAsset.week],["Month",selAsset.month],["Year",selAsset.year]] as any[]).map(([l,v])=>(
                  <View key={l} style={{flexDirection:"row",justifyContent:"space-between",paddingVertical:10,borderBottomColor:C.cardBorder,borderBottomWidth:1}}>
                    <Text style={{color:C.muted,fontSize:14}}>{l} return</Text>
                    <Text style={{color:pctC(v),fontSize:14,fontWeight:"700"}}>{v>=0?"+":""}{v}%</Text>
                  </View>
                ))}
                <View style={{marginTop:16}}>
                  <Text style={{fontSize:13,color:C.muted,marginBottom:6}}>Risk Level</Text>
                  <ProgressBar value={selAsset.risk} color={selAsset.risk>70?"#ef4444":selAsset.risk>40?"#f59e0b":"#10b981"} height={8}/>
                  <Text style={{fontSize:11,color:C.muted,marginTop:4}}>{selAsset.risk}% risk score</Text>
                </View>
                <TouchableOpacity onPress={()=>setSelAsset(null)} style={[styles.primaryButton,{marginTop:20}]}>
                  <Text style={styles.primaryButtonText}>Close</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

// ─── WEALTH BLOB ──────────────────────────────────────────────────────────────
function WealthBlob({ onBack }: any) {
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
function EventSimulator({ onBack }: any) {
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
    <ScrollView contentContainerStyle={{paddingBottom:100}}>
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
function ManifestationBoard({ onBack }: any) {
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
      <BackBtn onBack={onBack} title="Goals Board" subtitle="Manifest your financial dreams"/>
      <View style={[styles.gradientCard,{backgroundColor:"#7c3aed",marginBottom:12}]}>
        <Text style={{fontSize:28,marginBottom:8}}>✨</Text>
        <Text style={{fontWeight:"800",fontSize:18,color:"white"}}>Manifestation Board</Text>
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
function QuarterlyWrapped({ onBack }: any) {
  const [slide,setSlide]=useState(0);
  const slides=[
    {bg:"#4f46e5",emoji:"🎉",title:"Q1 2026 Wrapped",sub:"Your wealth journey this quarter"},
    {bg:"#065f46",emoji:"📈",title:"+12.5%",sub:"Portfolio growth this quarter",stat:"$53,750 gained"},
    {bg:"#1e3a8a",emoji:"🏆",title:"Top Move",sub:"Stocks led your portfolio",stat:"+18.4% annual"},
    {bg:"#7c3aed",emoji:"🎯",title:"3 Goals Active",sub:"On track for all of them",stat:"Keep going!"},
  ];
  const s=slides[slide];
  return (
    <ScrollView contentContainerStyle={{paddingBottom:100}}>
      <BackBtn onBack={onBack} title="Quarterly Wrapped" subtitle="Q1 2026 highlights"/>
      <View style={{backgroundColor:s.bg,borderRadius:24,padding:48,alignItems:"center",marginBottom:12}}>
        <Text style={{fontSize:56,marginBottom:16}}>{s.emoji}</Text>
        <Text style={{fontSize:36,fontWeight:"900",color:"white",letterSpacing:-1,marginBottom:8,textAlign:"center"}}>{s.title}</Text>
        <Text style={{fontSize:16,color:"rgba(255,255,255,0.8)",marginBottom:(s as any).stat?16:0,textAlign:"center"}}>{s.sub}</Text>
        {(s as any).stat&&<View style={{backgroundColor:"rgba(255,255,255,0.18)",borderRadius:99,paddingVertical:8,paddingHorizontal:20}}>
          <Text style={{fontSize:16,fontWeight:"700",color:"white"}}>{(s as any).stat}</Text>
        </View>}
      </View>
      <View style={{flexDirection:"row",gap:8,justifyContent:"center",marginBottom:14}}>
        {slides.map((_,i)=>(
          <TouchableOpacity key={i} onPress={()=>setSlide(i)}
            style={{width:i===slide?24:8,height:8,borderRadius:99,backgroundColor:i===slide?C.accent:"rgba(0,0,0,0.15)"}}/>
        ))}
      </View>
      <View style={{flexDirection:"row",gap:8}}>
        <TouchableOpacity onPress={()=>setSlide(Math.max(0,slide-1))} disabled={slide===0}
          style={[styles.navButton,{opacity:slide===0?0.4:1}]}>
          <Text style={{color:C.text,fontSize:14,fontWeight:"600"}}>← Prev</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={()=>setSlide(Math.min(slides.length-1,slide+1))} disabled={slide===slides.length-1}
          style={[styles.navButton,{flex:1,backgroundColor:slide===slides.length-1?"rgba(0,0,0,0.05)":C.accent}]}>
          <Text style={{color:slide===slides.length-1?C.muted:"white",fontSize:14,fontWeight:"600"}}>Next →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ─── WEALTH AGE ───────────────────────────────────────────────────────────────
function WealthAge({ onBack }: any) {
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
function Streaks({ onBack }: any) {
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
function Challenges({ onBack }: any) {
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
function VillainArc({ onBack }: any) {
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
function Menu({ mode, onModeToggle, onNavigate }: any) {
  const items=[
    {id:"wealth-age",emoji:"🕐",label:"Wealth Age"},
    {id:"streaks",emoji:"🔥",label:"Streaks"},
    {id:"challenges",emoji:"🏆",label:"Challenges"},
    {id:"villain-arc",emoji:"😈",label:"Villain Arc"},
    {id:"wrapped",emoji:"🎁",label:"Quarterly Wrapped"},
  ];
  return (
    <ScrollView contentContainerStyle={{paddingBottom:100}}>
      <Text style={{fontWeight:"800",fontSize:24,color:C.text,marginBottom:4}}>Menu</Text>
      <Text style={{fontSize:13,color:C.muted,marginBottom:20}}>Settings & features</Text>
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
    </ScrollView>
  );
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
function BottomNav({ active, onNavigate }: any) {
  const items=[
    {id:"dashboard",emoji:"🏠",label:"Home"},
    {id:"blob",emoji:"🫧",label:"Wealth"},
    {id:"manifestation",emoji:"🎯",label:"Goals"},
    {id:"menu",emoji:"☰",label:"Menu"},
  ];
  return (
    <View style={styles.bottomNav}>
      {items.map(item=>{
        const isActive=active===item.id;
        return (
          <TouchableOpacity key={item.id} onPress={()=>onNavigate(item.id)} style={styles.navItem} activeOpacity={0.7}>
            <Text style={{fontSize:20}}>{item.emoji}</Text>
            <Text style={{fontSize:10,fontWeight:isActive?"700":"400",color:isActive?C.accent:C.muted}}>{item.label}</Text>
            {isActive&&<View style={{width:4,height:4,borderRadius:2,backgroundColor:C.accent}}/>}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function WealthWellness() {
  const [view,setView]=useState("dashboard");
  const [mode,setMode]=useState("growth");
  const nav=(v: string)=>setView(v);
  const back=()=>setView("dashboard");

  const screens: any={
    dashboard:<Dashboard onNavigate={nav} mode={mode}/>,
    blob:<WealthBlob onBack={back}/>,
    manifestation:<ManifestationBoard onBack={back}/>,
    simulator:<EventSimulator onBack={back}/>,
    wrapped:<QuarterlyWrapped onBack={back}/>,
    "wealth-age":<WealthAge onBack={back}/>,
    streaks:<Streaks onBack={back}/>,
    challenges:<Challenges onBack={back}/>,
    "villain-arc":<VillainArc onBack={back}/>,
    menu:<Menu mode={mode} onModeToggle={()=>setMode((m: string)=>m==="growth"?"frugal":"growth")} onNavigate={nav}/>,
  };

  return (
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg}/>
      <View style={{flex:1,paddingHorizontal:16,paddingTop:12}}>
        {screens[view]||screens.dashboard}
      </View>
      <BottomNav active={view} onNavigate={nav}/>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderColor: C.cardBorder,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  backButton: {
    backgroundColor: "rgba(0,0,0,0.06)",
    borderRadius: 12,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  gradientCard: {
    backgroundColor: "#1d4ed8",
    borderRadius: 20,
    padding: 22,
    marginBottom: 12,
    overflow: "hidden",
  },
  gradientCircle: {
    position: "absolute",
    top: -28,
    right: -28,
    width: 110,
    height: 110,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 55,
  },
  quickAction: {
    backgroundColor: "white",
    borderColor: C.cardBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 15,
    alignItems: "center",
    gap: 6,
    width: "47%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  primaryButton: {
    backgroundColor: C.accent,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
  outlineButton: {
    padding: 14,
    borderColor: C.cardBorder,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  dashedButton: {
    padding: 14,
    borderColor: C.cardBorder,
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  input: {
    padding: 11,
    backgroundColor: "rgba(0,0,0,0.04)",
    borderColor: C.cardBorder,
    borderWidth: 1,
    borderRadius: 12,
    color: C.text,
    fontSize: 14,
    marginBottom: 10,
  },
  navButton: {
    flex: 1,
    padding: 14,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 14,
    alignItems: "center",
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.96)",
    borderTopColor: C.cardBorder,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === "ios" ? 20 : 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 10,
  },
  navItem: {
    flex: 1,
    paddingTop: 10,
    paddingBottom: 6,
    alignItems: "center",
    gap: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "75%",
  },
});
