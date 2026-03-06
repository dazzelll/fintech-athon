import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Linking,
} from "react-native";
import { C, ASSETS as FALLBACK_ASSETS, WEALTH_HISTORY, fmt } from "./constants";
import { Card, Badge, ProgressBar, styles, CryptoLiveTicker } from "./SharedUI";
import { LineChart, DonutChart } from "./Charts";
import { BlobEcosystem } from "./BlobEcosystem";
import { AssetDetailSheet } from "./AssetDetailSheet";
import { Gift, Zap } from "lucide-react-native";

const BASE_URL = "http://10.0.2.2:8000/api";

export function Dashboard({ onNavigate, mode }: any) {
  const [selAsset, setSelAsset] = useState<any>(null);

  const [assets, setAssets] = useState(FALLBACK_ASSETS);
  const [totalWealth, setTotalWealth] = useState(487500);
  const [health, setHealth] = useState<any>(null);

  const [isConnectingBank, setIsConnectingBank] = useState(false);
  const [isConnectingStripe, setIsConnectingStripe] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const [villainAlert, setVillainAlert] = useState<any>(null);

  // Reusable function to fetch the latest portfolio data
  const fetchPortfolio = () => {
    fetch(`${BASE_URL}/portfolio`)
      .then((res) => res.json())
      .then((data) => {
        console.log("✅ Live data fetched. Total:", data.total);
        setAssets(data.assets);
        setTotalWealth(data.total);
        if (data.health) setHealth(data.health);
      })
      .catch((err) => console.error("Portfolio fetch failed:", err));
  };

  // FIX 1: Correct route is /api/villain/roast (not /api/villain)
  // FIX 2: Must be POST with a JSON body so riskLevel reaches the backend
  const fetchVillainData = (riskLevel: number = 5) => {
    fetch(`${BASE_URL}/villain/roast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ riskLevel }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("🦹 Villain data:", data);
        if (data.alerts && data.alerts.length > 0) {
          setVillainAlert(data.alerts[0]);
        } else {
          setVillainAlert(null);
        }
      })
      .catch((err) => console.error("Villain fetch error:", err));
  };

  // THE STEALTH TRIGGER: Ruins data for the demo pitch
  const handleSecretSabotage = () => {
    fetch(`${BASE_URL}/demo/sabotage`, { method: "POST" })
      .then(() => {
        setIsConnected(true);
        fetchPortfolio();
        fetchVillainData(5);
      })
      .catch((err) => console.error("Sabotage error:", err));
  };

  // Run once on mount
  useEffect(() => {
    fetchPortfolio();
  }, []);

  // ACT 1: Connect Bank
  const handleConnectBank = () => {
    setIsConnectingBank(true);
    setTimeout(() => {
      setIsConnected(true);
      setIsConnectingBank(false);
      fetchPortfolio();
      fetchVillainData(5);
    }, 2000);
  };

  // ACT 3: Stripe Top-Up Redemption Flow
  const handleTopUp = async () => {
    setIsConnectingStripe(true);
    try {
      const res = await fetch(`${BASE_URL}/portfolio/stripe/top-up`, {
        method: "POST",
      });
      const data = await res.json();

      if (data.success && data.url) {
        console.log("💳 Opening Stripe Checkout...");
        Linking.openURL(data.url);

        setTimeout(async () => {
          await fetch(`${BASE_URL}/portfolio/stripe/confirm`, {
            method: "POST",
          });
          fetchPortfolio();
          setVillainAlert(null); // Clear warning — they fixed it!
          setIsConnectingStripe(false);
        }, 5000);
      } else {
        setIsConnectingStripe(false);
      }
    } catch (err) {
      console.error("Top Up Error:", err);
      setIsConnectingStripe(false);
    }
  };

  // Pull live wellness scores if available, else fall back to static values
  const wellnessMetrics: [string, number, string][] = [
    ["Diversification", health?.diversification ?? 78, C.accent],
    ["Liquidity", health?.liquidity ?? 65, "#10b981"],
    ["Behavioral Resilience", health?.behavioral_resilience ?? 82, "#8b5cf6"],
  ];

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 18,
        }}
      >
        <View>
          {/* Secret invisible long-press button for the demo */}
          <TouchableOpacity
            activeOpacity={1}
            onLongPress={handleSecretSabotage}
          >
            <Text
              style={{
                fontSize: 26,
                fontWeight: "900",
                color: C.text,
                letterSpacing: -0.8,
                paddingTop: 30,
              }}
            >
              Wealth Wellness
            </Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 13, color: C.muted }}>
            Your financial health at a glance
          </Text>
        </View>
      </View>

      {/* Blob Ecosystem */}
      <Card style={{ padding: 16, marginBottom: 12 }}>
        <Text
          style={{
            fontWeight: "700",
            fontSize: 16,
            color: C.text,
            marginBottom: 2,
          }}
        >
          Your Wealth Ecosystem
        </Text>
        <Text style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>
          Watch your assets float · Tap to explore
        </Text>
        <BlobEcosystem assets={assets} onBlobTap={setSelAsset} />
      </Card>

      {/* DYNAMIC 3-ACT DEMO UI */}
      {!isConnected ? (
        // ACT 1: Before Connecting
        <TouchableOpacity
          onPress={handleConnectBank}
          disabled={isConnectingBank}
          style={{
            backgroundColor: isConnectingBank ? "#374151" : "#111827",
            padding: 16,
            borderRadius: 16,
            marginBottom: 16,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 10,
          }}
        >
          {isConnectingBank ? (
            <>
              <ActivityIndicator color="white" />
              <Text style={{ color: "white", fontWeight: "800", fontSize: 16 }}>
                Syncing securely...
              </Text>
            </>
          ) : (
            <Text style={{ color: "white", fontWeight: "800", fontSize: 16 }}>
              🏦 Connect Bank Account
            </Text>
          )}
        </TouchableOpacity>
      ) : (
        // ACT 2 & 3: After Connecting — show Villain Alert if active
        villainAlert && (
          <View
            style={{
              backgroundColor: "#3f1d38",
              padding: 18,
              borderRadius: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: "#be123c",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <Text style={{ fontSize: 24, marginRight: 8 }}>
                {villainAlert.emoji}
              </Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: "#fda4af",
                    fontWeight: "800",
                    fontSize: 13,
                    textTransform: "uppercase",
                  }}
                >
                  Villain Arc Detected
                </Text>
                <Text
                  style={{
                    color: "white",
                    fontWeight: "600",
                    fontSize: 14,
                    marginTop: 2,
                  }}
                >
                  {villainAlert.message}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleTopUp}
              disabled={isConnectingStripe}
              style={{
                backgroundColor: isConnectingStripe ? "#881337" : "#e11d48",
                padding: 14,
                borderRadius: 12,
                marginTop: 6,
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
              }}
            >
              {isConnectingStripe ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text
                  style={{ color: "white", fontWeight: "800", fontSize: 15 }}
                >
                  💳 Offset Damage: Top Up $500
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )
      )}
      <CryptoLiveTicker/>
      {/* Total Wealth */}
      <View style={[styles.gradientCard, { marginBottom: 12 }]}>
        <View style={styles.gradientCircle} />
        <Text
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.75)",
            marginBottom: 4,
          }}
        >
          Total Wealth
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text
            style={{
              fontSize: 42,
              fontWeight: "900",
              color: "white",
              letterSpacing: -2,
            }}
          >
            {fmt(totalWealth)}
          </Text>
          {isConnected && (
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: "#10b981",
                marginTop: 10,
              }}
            />
          )}
        </View>
        <Text style={{ fontSize: 14, color: "#86efac", marginTop: 6 }}>
          ↑ +12.5% this month
        </Text>
      </View>

      {/* Quick Actions */}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 12,
        }}
      >
        {[
          { id: "simulator", icon: Zap, label: "Simulate Event" },
          { id: "wrapped", icon: Gift, label: "Quarterly Wrapped" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => onNavigate(item.id)}
              style={styles.quickAction}
              activeOpacity={0.75}
            >
              <Icon size={22} color={C.accent} />
              <Text style={{ fontSize: 12, color: C.muted, fontWeight: "600" }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Wellness — now driven by live health scores from backend */}
      <Card style={{ marginBottom: 12 }}>
        <Text
          style={{
            fontWeight: "700",
            fontSize: 16,
            color: C.text,
            marginBottom: 4,
          }}
        >
          Financial Wellness
        </Text>
        <Text style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>
          Key health indicators
        </Text>
        {wellnessMetrics.map(([label, val, color]) => (
          <View key={label} style={{ marginBottom: 14 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <Text style={{ fontSize: 13, color: C.text }}>{label}</Text>
              <Text style={{ fontSize: 13, color: C.muted, fontWeight: "600" }}>
                {val}%
              </Text>
            </View>
            <ProgressBar value={val} color={color} height={7} />
          </View>
        ))}
      </Card>

      {/* Asset Breakdown */}
      <Card style={{ marginBottom: 12 }}>
        <Text
          style={{
            fontWeight: "700",
            fontSize: 16,
            color: C.text,
            marginBottom: 4,
          }}
        >
          Asset Breakdown
        </Text>
        <Text style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>
          Tap any asset for details
        </Text>
        <View style={{ alignItems: "center", marginBottom: 14 }}>
          <DonutChart assets={assets} />
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {assets.map((a: any) => (
            <TouchableOpacity
              key={a.name}
              onPress={() => setSelAsset(a)}
              activeOpacity={0.75}
              style={{
                backgroundColor: `${a.color}0e`,
                borderColor: `${a.color}2e`,
                borderWidth: 1,
                borderRadius: 12,
                padding: 10,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                width: "47%",
              }}
            >
              <Text style={{ fontSize: 18 }}>{a.emoji}</Text>
              <View>
                <Text
                  style={{ fontSize: 12, color: C.text, fontWeight: "700" }}
                >
                  {a.name}
                </Text>
                <Text style={{ fontSize: 11, color: C.muted }}>
                  {fmt(a.value)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Trajectory */}
      <Card style={{ marginBottom: 12 }}>
        <Text
          style={{
            fontWeight: "700",
            fontSize: 16,
            color: C.text,
            marginBottom: 4,
          }}
        >
          6-Month Trajectory
        </Text>
        <Text style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>
          Portfolio growth over time
        </Text>
        <LineChart data={WEALTH_HISTORY} />
      </Card>

      {/* Mini Stats */}
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
        {[
          { id: "streaks", label: "Streaks", value: "12 🔥", sub: "Days saving" },
        ].map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => onNavigate(item.id)}
            style={[styles.card, { flex: 1, marginBottom: 0 }]}
            activeOpacity={0.75}
          >
            <Text style={{ fontWeight: "600", fontSize: 12, color: C.muted }}>
              {item.label}
            </Text>
            <Text style={{ fontSize: 26, fontWeight: "900", color: C.text }}>
              {item.value}
            </Text>
            <Text style={{ fontSize: 11, color: C.muted }}>{item.sub}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Asset Detail Modal */}
      <Modal
        visible={!!selAsset}
        transparent
        animationType="slide"
        onRequestClose={() => setSelAsset(null)}
      >
        {selAsset && (
          <AssetDetailSheet
            asset={selAsset}
            onClose={() => setSelAsset(null)}
          />
        )}
      </Modal>
    </ScrollView>
  );
}