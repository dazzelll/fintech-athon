import React from 'react';
import Svg, { Path, Circle, Text as SvgText, Defs, LinearGradient, Stop } from "react-native-svg";
import { C } from './constants';

export function LineChart({ data, color=C.accent }: any) {
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

export function DonutChart({ assets, size=130 }: any) {
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