import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal } from "react-native";
import { C, ASSETS, WEALTH_HISTORY, fmt } from "./constants";
import { Card, Badge, ProgressBar, styles } from "./SharedUI";
import { LineChart, DonutChart } from "./Charts";
import { BlobEcosystem } from "./BlobEcosystem";
import { AssetDetailSheet } from "./AssetDetailSheet";

export function Dashboard({ onNavigate, mode }: any) {
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
        {selAsset&&<AssetDetailSheet asset={selAsset} onClose={()=>setSelAsset(null)}/>}
      </Modal>
    </ScrollView>
  );
}