import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import Svg, { Path, Ellipse, Text as SvgText, Defs, RadialGradient, Stop } from "react-native-svg";
import { lighten } from "./constants";

const BLOB_LAYOUT = [
  { r:70, x:215, y:75  },
  { r:58, x:90,  y:95  },
  { r:44, x:48,  y:195 },
  { r:36, x:248, y:185 },
  { r:30, x:168, y:198 },
];

export function FloatingBlob({ asset, size, x, y, onTap, phase=0 }: any) {
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
        <Ellipse cx={cx*0.68} cy={cy*0.52} rx={r*0.24} ry={r*0.13} fill="rgba(255,255,255,0.48)"/>
        <SvgText x={cx} y={cy*0.88} fontSize={eyeSize} textAnchor="middle" fill="white" fontWeight="900">{eyeTxt}</SvgText>
        <SvgText x={cx} y={cy*1.22} fontSize={mthSize} textAnchor="middle" fill="white">{mthTxt}</SvgText>
      </Svg>
    </TouchableOpacity>
  );
}

export function BlobEcosystem({ assets, onBlobTap }: any) {
  const H=260;
  return (
    <View style={{width:"100%",height:H,backgroundColor:"#dce8f8",borderRadius:16,overflow:"hidden"}}>
      {assets.map((asset: any, i: number)=>{
        const l=BLOB_LAYOUT[i];
        const s=l.r*2;
        return (
          <FloatingBlob
            key={asset.name} asset={asset} size={s}
            x={l.x-l.r} y={l.y-l.r} onTap={onBlobTap} phase={i*0.65}
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