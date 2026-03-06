import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { C } from './constants';
import { Home, Target, Settings, ChevronLeft, Trophy } from 'lucide-react-native';

export function Card({ children, style={}, onPress }: any) {
  return (
    <TouchableOpacity activeOpacity={onPress ? 0.75 : 1} onPress={onPress} style={[styles.card, style]}>
      {children}
    </TouchableOpacity>
  );
}

export function ProgressBar({ value, color=C.accent, height=6 }: any) {
  return (
    <View style={{backgroundColor:"rgba(0,0,0,0.07)",borderRadius:99,height,overflow:"hidden"}}>
      <View style={{width:`${Math.min(100,value)}%`,height,backgroundColor:color,borderRadius:99}}/>
    </View>
  );
}

export function BackBtn({ onBack, title, subtitle }: any) {
  return (
    <View style={{flexDirection:"row",alignItems:"center",gap:12,marginBottom:20}}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <ChevronLeft size={22} color={C.text} />
      </TouchableOpacity>
      <View>
        <Text style={{fontWeight:"800",fontSize:22,color:C.text}}>{title}</Text>
        {subtitle&&<Text style={{fontSize:13,color:C.muted}}>{subtitle}</Text>}
      </View>
    </View>
  );
}

export function Badge({ children, color=C.accent }: any) {
  return (
    <View style={{backgroundColor:`${color}18`,borderColor:`${color}40`,borderWidth:1,borderRadius:99,paddingVertical:3,paddingHorizontal:10}}>
      <Text style={{color,fontSize:12,fontWeight:"700"}}>{children}</Text>
    </View>
  );
}

export function BottomNav({ active, onNavigate }: any) {
  const items = [
    { id: "dashboard",     icon: Home,     label: "Home"  },
    { id: "manifestation", icon: Target,   label: "Goals" },
    { id: "challenges",  icon: Trophy,  label: "Challenges" },
    { id: "menu",          icon: Settings, label: "Settings"  },
  ];

  return (
    <View style={styles.bottomNav}>
      {items.map(item => {
        const isActive = active === item.id;
        const Icon = item.icon;
        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => onNavigate(item.id)}
            style={styles.navItem}
            activeOpacity={0.7}
          >
            <Icon size={20} color={isActive ? C.accent : C.muted} />
            <Text style={{ fontSize: 10, fontWeight: isActive ? "700" : "400", color: isActive ? C.accent : C.muted }}>
              {item.label}
            </Text>
            {isActive && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: C.accent }} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export const styles = StyleSheet.create({
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