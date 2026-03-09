import React, { useState } from "react";
import { SafeAreaView, View, StatusBar, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { C } from "./wellness/constants";
import { BottomNav } from "./wellness/SharedUI";
import { Dashboard } from "./wellness/Dashboard";
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
    <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 40, justifyContent: "space-between" }}>
      <View>
        <Text style={{ fontSize: 26, fontWeight: "800", color: C.text, marginBottom: 8 }}>
          Connect your demo brokerage
        </Text>
        <Text style={{ fontSize: 14, color: C.muted, marginBottom: 24 }}>
          We use Alpaca&apos;s paper trading sandbox to pull your stocks and cash into the Wealth Wellness blobs.
        </Text>

        <View style={{ backgroundColor: "white", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "rgba(0,0,0,0.06)" }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: C.text, marginBottom: 6 }}>Alpaca Paper</Text>
          <Text style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>
            Uses API keys configured on the backend (paper-api.alpaca.markets). No live money involved.
          </Text>

          <TouchableOpacity
            onPress={connect}
            disabled={status === "loading"}
            style={{
              backgroundColor: C.accent,
              borderRadius: 999,
              paddingVertical: 10,
              paddingHorizontal: 20,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {status === "loading" ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ color: "white", fontSize: 15, fontWeight: "700" }}>
                {status === "ok" ? "Connected" : "Connect Alpaca demo"}
              </Text>
            )}
          </TouchableOpacity>

          {message ? (
            <Text
              style={{
                marginTop: 10,
                fontSize: 12,
                color: status === "error" ? "#b91c1c" : C.muted,
              }}
            >
              {message}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={{ marginBottom: 24 }}>
        <TouchableOpacity
          onPress={onUseDemo}
          style={{
            borderRadius: 999,
            paddingVertical: 10,
            paddingHorizontal: 20,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.04)",
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "600", color: C.text }}>
            Skip for now – use demo portfolio
          </Text>
        </TouchableOpacity>
      </View>
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