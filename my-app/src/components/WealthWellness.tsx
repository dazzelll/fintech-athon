import React, { useState } from "react";
import { SafeAreaView, View, StatusBar, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { C } from "./wellness/constants";
import { BottomNav } from "./wellness/SharedUI";
import { Dashboard } from "./wellness/Dashboard";
import { Code2, ChevronRight, ArrowRight, Building } from "lucide-react-native";
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

function ConnectionScreen({ onDone, onUseDemo }: { onDone: () => void; onUseDemo: () => void }) {
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  const [connectedServices, setConnectedServices] = useState<string[]>([]);

  const connectAllServices = async () => {
    try {
      setConnectionStatus("loading");
      setMessage("");
      setConnectedServices([]);

      // Connect Alpaca
      try {
        const alpacaRes = await fetch(`${API_BASE_URL}/alpaca/status`);
        const alpacaData = await alpacaRes.json();
        if (alpacaData.connected) {
          setConnectedServices(prev => [...prev, "Alpaca Sandbox"]);
        }
      } catch (e) {
        console.log("Alpaca connection failed");
      }

      // Connect Finverse
      try {
        const finverseRes = await fetch(`${API_BASE_URL}/finverse/link-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        
        const finverseData = await finverseRes.json();
        
        if (!finverseData.success) {
          console.log("🔗 Finverse not reachable - running demo mode");
          setConnectedServices(prev => [...prev, "Bank Accounts (Demo)"]);
        } else {
          setConnectedServices(prev => [...prev, "Bank Accounts"]);
        }
      } catch (err) {
        console.log("Finverse connection failed - using demo");
        setConnectedServices(prev => [...prev, "Bank Accounts (Demo)"]);
      }

      setConnectionStatus("ok");
      setMessage(`Connected: ${connectedServices.length > 0 ? connectedServices.join(", ") : "Demo mode"}`);
      setTimeout(onDone, 1000);
      
    } catch (e) {
      setConnectionStatus("error");
      setMessage("Connection failed. Please try again.");
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

      {/* Single Connect All Button */}
      <TouchableOpacity 
        style={{
          flexDirection: "row", alignItems: "center", backgroundColor: "#8b5cf6",
          borderWidth: 1, borderColor: "#7c3aed", borderRadius: 20, padding: 20,
          marginBottom: 16, shadowColor: "#8b5cf6", shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2, shadowRadius: 8, elevation: 3
        }}
        onPress={connectAllServices}
        disabled={connectionStatus === "loading" || connectionStatus === "ok"}
        activeOpacity={0.8}
      >
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
          <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: "#a78bfa", alignItems: "center", justifyContent: "center", marginRight: 16 }}>
            {connectionStatus === "loading" ? (
              <ActivityIndicator color="white" size={24} />
            ) : connectionStatus === "ok" ? (
              <Text style={{ fontSize: 20 }}>✅</Text>
            ) : (
              <Text style={{ fontSize: 20 }}>🔗</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: "800", color: "white", marginBottom: 2 }}>
              {connectionStatus === "loading" ? "Connecting..." : 
               connectionStatus === "ok" ? "Connection Complete" : 
               "Connect All Services"}
            </Text>
            <Text style={{ fontSize: 13, color: "#e9d5ff", fontWeight: "600" }}>
              {connectionStatus === "loading" ? "Linking Alpaca & banks..." : 
               connectionStatus === "ok" ? `${connectedServices.length} services connected` :
               "Alpaca Sandbox + Bank Accounts"}
            </Text>
          </View>
        </View>
        {connectionStatus === "loading" ? null : connectionStatus === "ok" ? null : (
          <ChevronRight color="white" size={24} style={{ marginLeft: 12 }} />
        )}
      </TouchableOpacity>

      {/* Skip to Demo */}
      <TouchableOpacity 
        style={{
          flexDirection: "row", alignItems: "center", backgroundColor: "#f9fafb",
          borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 20, padding: 20
        }}
        onPress={onUseDemo}
        disabled={connectionStatus === "loading"}
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
      {message && connectionStatus === "error" ? (
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
      <ConnectionScreen
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