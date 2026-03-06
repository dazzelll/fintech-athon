import React, { useState } from "react";
import { SafeAreaView, View, StatusBar } from "react-native";
import { C } from "./wellness/constants";
import { BottomNav } from "./wellness/SharedUI";
import { Dashboard } from "./wellness/Dashboard";
import { 
  WealthBlob, EventSimulator, ManifestationBoard, QuarterlyWrapped, 
  WealthAge, Streaks, Challenges, VillainArc, Menu 
} from "./wellness/FeatureScreens";

export default function WealthWellness() {
  const [view, setView] = useState("dashboard");
  const [mode, setMode] = useState("growth");
  const [riskLevel, setRiskLevel] = useState(5)
  
  const nav = (v: string) => setView(v);
  const back = () => setView("dashboard");

  const screens: any = {
    dashboard: <Dashboard onNavigate={nav} mode={mode} />,
    blob: <WealthBlob onBack={back} />,
    manifestation: <ManifestationBoard onBack={back} />,
    simulator: <EventSimulator onBack={back} />,
    wrapped: <QuarterlyWrapped onBack={back} />,
    "wealth-age": <WealthAge onBack={back} />,
    streaks: <Streaks onBack={back} />,
    challenges: <Challenges onBack={back} />,
    "villain-arc": <VillainArc onBack={back} riskLevel={riskLevel} />,
    menu: <Menu mode={mode} onModeToggle={() => setMode((m: string) => m === "growth" ? "frugal" : "growth")} onNavigate={nav} />,
  };

// In WealthWellness.tsx, change the render logic:
return (
  <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
    <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
    
    {view === "wrapped" ? (
      // Full screen — no padding, no nav
      <QuarterlyWrapped onBack={back} />
    ) : (
      <>
        <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 12 }}>
          {screens[view] || screens.dashboard}
        </View>
        <BottomNav active={view} onNavigate={nav} />
      </>
    )}
  </SafeAreaView>
);
}