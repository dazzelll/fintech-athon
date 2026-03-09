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
import { Card, Badge, ProgressBar, styles, CryptoLiveTicker, StockLiveTicker } from "./SharedUI";
import { LineChart, DonutChart } from "./Charts";
import { BlobEcosystem } from "./BlobEcosystem";
import { AssetDetailSheet } from "./AssetDetailSheet";
import { Gift, Zap, Bitcoin, PiggyBank, Home, ChartLine, ScrollText, TrendingUp, BanknoteArrowDown  } from "lucide-react-native";
import { API_BASE_URL } from "../../lib/api";

// 🟢 1. CACHE VARIABLE OUTSIDE THE COMPONENT
let globalPortfolioCache: any = null;

export function Dashboard({ onNavigate, mode, useDemoAccount }: any) {
  const [selAsset, setSelAsset] = useState<any>(null);

  // 🟢 2. CHECK CACHE FIRST BEFORE USING FALLBACK DATA
  const [assets, setAssets] = useState(globalPortfolioCache?.assets || FALLBACK_ASSETS);
  const [totalWealth, setTotalWealth] = useState(globalPortfolioCache?.total_wealth || 487500);
  const [grossWealth, setGrossWealth] = useState(globalPortfolioCache?.gross_total || 487500);
  const [totalDebt, setTotalDebt] = useState(globalPortfolioCache?.debt || 0);    
  const [health, setHealth] = useState<any>(globalPortfolioCache?.health || null);
  const [trajectory, setTrajectory] = useState<any[]>(globalPortfolioCache?.history || WEALTH_HISTORY);

  const [isConnectingBank, setIsConnectingBank] = useState(false);
  const [isConnectingStripe, setIsConnectingStripe] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const [villainAlert, setVillainAlert] = useState<any>(null);

  const assetIcons: Record<string, any> = {
    "Stocks":               TrendingUp,
    "Real Estate & Others": Home,
    "Savings":              PiggyBank,
    "Crypto":               Bitcoin,
    "Bonds":                ScrollText,
  };

  // Use sandbox (Alpaca + supplemental) or pure mock depending on mode
  const fetchPortfolio = () => {
    if (useDemoAccount) {
      fetch(`${API_BASE_URL}/portfolio`)
        .then((res) => res.json())
        .then((data) => {
          console.log("✅ Demo portfolio fetched. Total:", data.total);
          
          // 🟢 3A. SAVE THE DEMO DATA TO CACHE
          globalPortfolioCache = {
            assets: data.assets ?? FALLBACK_ASSETS,
            total_wealth: data.total_wealth ?? data.total, 
            gross_total: data.gross_total ?? data.total,
            debt: data.debt ?? 0,
            health: data.health ?? null,
            history: (data.history && Array.isArray(data.history) && data.history.length > 0) ? data.history : WEALTH_HISTORY
          };

          setAssets(globalPortfolioCache.assets);
          setTotalWealth(globalPortfolioCache.total_wealth ?? WEALTH_HISTORY[WEALTH_HISTORY.length - 1].v);
          setGrossWealth(globalPortfolioCache.gross_total);
          setTotalDebt(globalPortfolioCache.debt);
          if (globalPortfolioCache.health) setHealth(globalPortfolioCache.health);
          setTrajectory(globalPortfolioCache.history);
        })
        .catch((err) => {
          console.error("Demo portfolio fetch failed, using local fallback:", err);
          setAssets(FALLBACK_ASSETS);
          setTotalWealth(WEALTH_HISTORY[WEALTH_HISTORY.length - 1].v);
          setHealth(null);
          setTrajectory(WEALTH_HISTORY);
        });
      return;
    }

    fetch(`${API_BASE_URL}/portfolio/sandbox`)
      .then((res) => res.json())
      .then((data) => {
        console.log("📦 portfolio data:", JSON.stringify(data));
        console.log("✅ Live data fetched. Total:", data.total);
        
        // 🟢 3B. SAVE THE LIVE SANDBOX DATA TO CACHE
        globalPortfolioCache = {
            assets: data.assets ?? FALLBACK_ASSETS,
            total_wealth: data.total_wealth ?? data.total, 
            gross_total: data.gross_total ?? data.total,
            debt: data.debt ?? 0,
            health: data.health ?? null,
            history: (data.history && Array.isArray(data.history) && data.history.length > 0) ? data.history : WEALTH_HISTORY
        };

        setAssets(globalPortfolioCache.assets);
        setTotalWealth(globalPortfolioCache.total_wealth);
        setGrossWealth(globalPortfolioCache.gross_total);
        setTotalDebt(globalPortfolioCache.debt); 
        if (globalPortfolioCache.health) setHealth(globalPortfolioCache.health);
        setTrajectory(globalPortfolioCache.history);
      })
      .catch((err) => console.error("Portfolio fetch failed:", err));
  };

  const fetchVillainData = (riskLevel: number = 5) => {
    fetch(`${API_BASE_URL}/villain/roast`, {
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

  const handleSecretSabotage = () => {
    fetch(`${API_BASE_URL}/demo/sabotage`, { method: "POST" })
      .then(() => {
        setIsConnected(true);
        fetchPortfolio();
        fetchVillainData(5);
      })
      .catch((err) => console.error("Sabotage error:", err));
  };

  useEffect(() => {
    fetchPortfolio();
  }, [useDemoAccount]);

  const handleConnectBank = () => {
    setIsConnectingBank(true);
    setTimeout(() => {
      setIsConnected(true);
      setIsConnectingBank(false);
      fetchPortfolio();
      fetchVillainData(5);
    }, 2000);
  };

  const handleTopUp = async () => {
    setIsConnectingStripe(true);
    try {
      const res = await fetch(`${API_BASE_URL}/portfolio/stripe/top-up`, {
        method: "POST",
      });
      const data = await res.json();

      if (data.success && data.url) {
        console.log("💳 Opening Stripe Checkout...");
        Linking.openURL(data.url);

        setTimeout(async () => {
          await fetch(`${API_BASE_URL}/portfolio/stripe/confirm`, {
            method: "POST",
          });
          fetchPortfolio();
          setVillainAlert(null); 
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
          alignItems: "center",
          marginBottom: 18,
        }}
      >
        <View>
          <TouchableOpacity
            activeOpacity={1}
            onLongPress={handleSecretSabotage}
          >
            <Text
              style={{
                fontSize: 28,
                fontWeight: "900",
                color: C.text,
                letterSpacing: -0.8,
                paddingTop: 30,
              }}
            >
              Stack'd
            </Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 13, color: C.muted }}>
            Your financial health at a glance
          </Text>
        </View>

        {!isConnected && (
          <TouchableOpacity
            onPress={handleConnectBank}
            disabled={isConnectingBank}
            style={{
              backgroundColor: isConnectingBank ? "#374151" : "#111827",
              paddingVertical: 8,
              paddingHorizontal: 14,
              borderRadius: 20,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginTop: 24,
            }}
          >
            {isConnectingBank ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={{ color: "white", fontWeight: "700", fontSize: 13 }}>
                Connect to Stripe
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* DYNAMIC 3-ACT DEMO UI */}
      {isConnected && villainAlert && (
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
              <Text style={{ color: "white", fontWeight: "800", fontSize: 15 }}>
                💳 Offset Damage: Top Up $500
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* ── Unified Wealth Overview ── */}
      <Card style={{ padding: 16, marginBottom: 12 }}>
        {/* Header + Total */}
        <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"flex-start", marginBottom: 16 }}>
          <View>
            <Text style={{ fontWeight:"700", fontSize:16, color:C.text }}>Wealth Overview</Text>
            <Text style={{ fontSize:12, color:C.muted }}>Tap a blob to explore</Text>
          </View>
          <View style={{ alignItems:"flex-end" }}>
            <Text style={{ fontSize:12, color:C.muted, fontWeight:"700", marginBottom: -2 }}>Net Worth</Text>
            <Text style={{ fontSize:28, fontWeight:"900", color:C.text, letterSpacing:-1 }}>
              {fmt(totalWealth)}
            </Text>
            
            {totalDebt > 0 && (
              <Text style={{ fontSize:12, color:C.muted, fontWeight:"600", marginTop: 2 }}>
                Gross Assets: {fmt(grossWealth)}
              </Text>
            )}
            
            <Text style={{ fontSize:12, color:"#10b981", fontWeight:"600", marginTop: 4 }}>↑ +12.5% this month</Text>
            {isConnected && (
              <View style={{ flexDirection:"row", alignItems:"center", gap:4, marginTop:4 }}>
                <View style={{ width:6, height:6, borderRadius:3, backgroundColor:"#10b981" }}/>
                <Text style={{ fontSize:10, color:"#10b981", fontWeight: "600" }}>Live</Text>
              </View>
            )}
          </View>
        </View>

        {/* Blob Ecosystem */}
        <BlobEcosystem assets={assets} onBlobTap={setSelAsset} />

        {/* Asset list */}
        <View style={{ marginTop: 16 }}>
          {assets.map((a: any, i: number) => {
            const Icon = assetIcons[a.name] ?? TrendingUp;
            return (
              <TouchableOpacity
                key={a.name}
                onPress={() => setSelAsset(a)}
                activeOpacity={0.75}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 10,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: "rgba(0,0,0,0.05)",
                  gap: 10,
                }}
              >
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: a.color }} />
                <Icon size={16} color={a.color} />
                <Text style={{ fontSize: 13, fontWeight: "700", color: C.text, flex: 1 }}>{a.name}</Text>
                <Text style={{ fontSize: 14, fontWeight: "800", color: C.text }}>{fmt(a.value)}</Text>
              </TouchableOpacity>
            );
          })}

          {/* Debt appended at the bottom of the list */}
          {totalDebt > 0 && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 10,
                borderTopWidth: 1, 
                borderTopColor: "rgba(0,0,0,0.05)",
                gap: 10,
              }}
            >
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#ef4444" }} />
              <BanknoteArrowDown size={16} color="#ef4444" />
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#ef4444", flex: 1 }}>Total Debt</Text>
              <Text style={{ fontSize: 14, fontWeight: "800", color: "#ef4444" }}>−{fmt(totalDebt)}</Text>
            </View>
          )}
        </View>
      </Card>

      <CryptoLiveTicker/>
      <StockLiveTicker/>

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

      {/* Wellness */}
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
        <LineChart data={trajectory?.length ? trajectory : WEALTH_HISTORY} />
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