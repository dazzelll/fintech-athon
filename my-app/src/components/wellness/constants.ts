export const C = {
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
  
  export const ASSETS = [
    { name:"Stocks",      value:185000, pct:38, color:"#3b82f6", emoji:"📈", mood:"happy",   day:0.8,  week:2.3,  month:5.2,  year:18.4, risk:72 },
    { name:"Real Estate", value:150000, pct:31, color:"#10b981", emoji:"🏠", mood:"happy",   day:0.1,  week:0.4,  month:2.1,  year:8.7,  risk:45 },
    { name:"Savings",     value:75000,  pct:15, color:"#8b5cf6", emoji:"💰", mood:"happy",   day:0.01, week:0.05, month:0.4,  year:4.5,  risk:5  },
    { name:"Crypto",      value:45000,  pct:9,  color:"#f59e0b", emoji:"₿",  mood:"worried", day:-2.3, week:-5.8, month:-8.2, year:45.6, risk:95 },
    { name:"Bonds",       value:32500,  pct:7,  color:"#ec4899", emoji:"📜", mood:"neutral", day:0.02, week:0.1,  month:0.8,  year:5.2,  risk:25 },
  ];
  
  export const WEALTH_HISTORY = [
    {m:"Oct",v:445000},{m:"Nov",v:458000},{m:"Dec",v:472000},
    {m:"Jan",v:465000},{m:"Feb",v:480000},{m:"Mar",v:487500},
  ];
  
  export const fmt  = (n: number) => n>=1e6?`$${(n/1e6).toFixed(2)}M`:n>=1000?`$${(n/1000).toFixed(0)}K`:`$${n}`;
  export const pctC = (v: number) => v>=0?"#10b981":"#ef4444";
  
  export function lighten(hex: string, amt: number) {
    const n=parseInt(hex.slice(1),16);
    const r=Math.min(255,((n>>16)&0xff)+Math.round(255*amt));
    const g=Math.min(255,((n>>8)&0xff)+Math.round(255*amt));
    const b=Math.min(255,(n&0xff)+Math.round(255*amt));
    return `rgb(${r},${g},${b})`;
  }