import React, { useState } from "react";
import { SafeAreaView, View, StatusBar, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { C } from "./wellness/constants";
import { BottomNav } from "./wellness/SharedUI";
import { Dashboard } from "./wellness/Dashboard";
import { Code2, ChevronRight, ArrowRight } from "lucide-react-native";
import { 
  WealthBlob,
  EventSimulator,
  ManifestationBoard,
  QuarterlyWrapped,
  WealthAge,
  Streaks,
  Challenges,
  VillainArc,
  ManualAssets,
  Menu,
} from "./wellness/FeatureScreens";

import { API_BASE_URL } from "../lib/api"

function AlpacaConnectScreen({ onDone, onUseDemo }: { onDone: () => void; onUseDemo: () => void }) {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  const connect = async () => {
    try {
      setStatus("loading");
      setMessage("");
      const res = await fetch(`${API_BASE_URL}/alpaca/status`);
      const data = await res.json();
      if (data.connected) {
        setStatus("ok");
        setMessage("Connected to Alpaca paper brokerage.");
        setTimeout(onDone, 600);
      } else {
        setStatus("error");
        setMessage(data.reason || "Unable to connect to Alpaca.");
      }
    } catch (e) {
      setStatus("error");
      setMessage("Network error. Please check the backend is running.");
    }
  };

  return (
    <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 40, justifyContent: "center", paddingBottom: 60 }}>
      
      {/* Header */}
      <View style={{ marginBottom: 40 }}>
        <Text style={{ fontSize: 14, fontWeight: "800", color: "#8b5cf6", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 8 }}>
          Welcome back, Blobby
        </Text>
        <Text style={{ fontSize: 34, fontWeight: "900", color: "#111827", letterSpacing: -1, marginBottom: 12 }}>
          Connect your wealth
        </Text>
        <Text style={{ fontSize: 15, color: "#6b7280", lineHeight: 22, fontWeight: "500" }}>
          Link your brokerage to get real-time AI insights, or explore using our demo sandbox.
        </Text>
      </View>

      {/* Option 1: Alpaca */}
      <TouchableOpacity 
        style={{
          flexDirection: "row", alignItems: "center", backgroundColor: "#fffbeb",
          borderWidth: 1, borderColor: "#fde68a", borderRadius: 20, padding: 20,
          marginBottom: 16, shadowColor: "#f59e0b", shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1, shadowRadius: 8, elevation: 3
        }}
        onPress={connect}
        disabled={status === "loading" || status === "ok"}
        activeOpacity={0.8}
      >
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
          <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: "#fef3c7", alignItems: "center", justifyContent: "center", marginRight: 16 }}>
            <Code2 color="#f59e0b" size={24} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: "800", color: "#b45309", marginBottom: 2 }}>
              Alpaca Sandbox
            </Text>
            <Text style={{ fontSize: 13, color: "#d97706", fontWeight: "600" }}>
              {status === "ok" ? "Connected successfully" : "Sync paper trading account"}
            </Text>
          </View>
        </View>
        {status === "loading" ? (
          <ActivityIndicator color="#f59e0b" style={{ marginLeft: 12 }} />
        ) : status === "ok" ? (
          <Text style={{ fontSize: 20, marginLeft: 12 }}>✅</Text>
        ) : (
          <ChevronRight color="#f59e0b" size={24} style={{ marginLeft: 12 }} />
        )}
      </TouchableOpacity>

      {/* Option 2: Skip to Demo */}
      <TouchableOpacity 
        style={{
          flexDirection: "row", alignItems: "center", backgroundColor: "#f9fafb",
          borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 20, padding: 20
        }}
        onPress={onUseDemo}
        disabled={status === "loading"}
        activeOpacity={0.8}
      >
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
          <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center", marginRight: 16 }}>
            <Text style={{ fontSize: 20 }}>✨</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: "700", color: "#374151", marginBottom: 2 }}>
              Use Demo Portfolio
            </Text>
            <Text style={{ fontSize: 13, color: "#6b7280", fontWeight: "500" }}>
              Skip connection and explore
            </Text>
          </View>
        </View>
        <ArrowRight color="#8b5cf6" size={20} style={{ marginLeft: 12 }} />
      </TouchableOpacity>

      {/* Error Message */}
      {message && status === "error" ? (
        <Text style={{ marginTop: 24, fontSize: 13, color: "#ef4444", textAlign: "center", fontWeight: "600" }}>
          {message}
        </Text>
      ) : null}
      
    </View>
  );
}

export default function WealthWellness() {
  const [view, setView] = useState("connect");
  const [mode, setMode] = useState("growth");
  const [riskLevel, setRiskLevel] = useState(5)
  const [useDemoAccount, setUseDemoAccount] = useState(false);
  
  const nav = (v: string) => setView(v);
  const back = () => setView("dashboard");

  const screens: any = {
    dashboard: <Dashboard onNavigate={nav} mode={mode} useDemoAccount={useDemoAccount} />,
    blob: <WealthBlob onBack={back} />,
    manifestation: <ManifestationBoard onBack={back} />,
    simulator: <EventSimulator onBack={back} />,
    wrapped: <QuarterlyWrapped onBack={back} />,
    "wealth-age": <WealthAge onBack={back} />,
    streaks: <Streaks onBack={back} />,
    challenges: <Challenges onBack={back} />,
    "villain-arc": <VillainArc onBack={back} riskLevel={riskLevel} />,
    "manual-assets": <ManualAssets onBack={back} />,
    menu: <Menu mode={mode} onModeToggle={() => setMode((m: string) => m === "growth" ? "frugal" : "growth")} onNavigate={nav} />,
  };

// In WealthWellness.tsx, change the render logic:
if (view === "connect") {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <AlpacaConnectScreen
        onDone={() => setView("dashboard")}
        onUseDemo={() => {
          setUseDemoAccount(true);
          setView("dashboard");
        }}
      />
    </SafeAreaView>
  );
}

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