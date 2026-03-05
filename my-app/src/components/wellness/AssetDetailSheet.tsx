import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle, Text as SvgText, Defs, LinearGradient, Stop } from "react-native-svg";
import { C, pctC, fmt } from './constants';
import { ProgressBar, styles } from './SharedUI';

const ASSET_HOLDINGS: any = { /* ... Copy ASSET_HOLDINGS object from original file ... */ };
const ASSET_HISTORY: any = { /* ... Copy ASSET_HISTORY object from original file ... */ };
const ASSET_META: any = { /* ... Copy ASSET_META object from original file ... */ };

export function AssetDetailSheet({ asset, onClose }: any) {
  const meta = ASSET_META[asset.name] || {};
  const holdings = ASSET_HOLDINGS[asset.name] || [];
  const history = ASSET_HISTORY[asset.name] || [];
  const healthEmoji = asset.mood==="happy"?"😊":asset.mood==="worried"?"😟":"😐";

  // Mini line chart for history
  const W=300, H=120;
  const vals = history.map((d:any)=>d.v);
  const min=Math.min(...vals), max=Math.max(...vals);
  const pts = history.map((d:any,i:number)=>({
    x: 8+(i/(history.length-1))*(W-16),
    y: H-16-((d.v-min)/(max-min||1))*(H-32), ...d
  }));
  const linePath = pts.map((p:any,i:number)=>`${i===0?"M":"L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${pts[pts.length-1].x},${H} L${pts[0].x},${H} Z`;

  return (
    <View style={{flex:1,backgroundColor:"rgba(0,0,0,0.5)",justifyContent:"flex-end"}}>
      <TouchableOpacity style={{flex:1}} activeOpacity={1} onPress={onClose}/>
      <View style={{backgroundColor:C.bg,borderTopLeftRadius:28,borderTopRightRadius:28,maxHeight:"92%",overflow:"hidden"}}>
        {/* Header */}
        <View style={{backgroundColor:asset.color,paddingTop:28,paddingBottom:32,paddingHorizontal:24,alignItems:"center",position:"relative"}}>
          <TouchableOpacity onPress={onClose} style={{position:"absolute",top:16,right:16,width:32,height:32,borderRadius:16,backgroundColor:"rgba(255,255,255,0.2)",alignItems:"center",justifyContent:"center"}}>
            <Text style={{color:"white",fontSize:18,fontWeight:"700"}}>×</Text>
          </TouchableOpacity>
          <View style={{width:72,height:72,borderRadius:36,backgroundColor:"rgba(255,255,255,0.25)",alignItems:"center",justifyContent:"center",marginBottom:12}}>
            <Text style={{fontSize:36}}>{asset.emoji}</Text>
          </View>
          <Text style={{fontSize:26,fontWeight:"900",color:"white"}}>{asset.name}</Text>
          <Text style={{fontSize:14,color:"rgba(255,255,255,0.8)",marginTop:2}}>{meta.subtitle}</Text>
        </View>

        <ScrollView contentContainerStyle={{padding:20,paddingBottom:40}} showsVerticalScrollIndicator={false}>
          {/* ... Copy the rest of the AssetDetailSheet View UI from the original file ... */}
        </ScrollView>
      </View>
    </View>
  );
}