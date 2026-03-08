import React from "react";
import { View, Text, TouchableOpacity, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { C } from "../components/wellness/constants";

export default function LoginScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View
        style={{
          flex: 1,
          paddingHorizontal: 24,
          paddingTop: 60,
          justifyContent: "space-between",
        }}
      >
        <View>
          <Text
            style={{
              fontSize: 32,
              fontWeight: "900",
              color: C.text,
              marginBottom: 8,
              letterSpacing: -0.8,
            }}
          >
            Welcome back
          </Text>
          <Text style={{ fontSize: 14, color: C.muted, marginBottom: 32 }}>
            Sign in to continue your Wealth Wellness journey.
          </Text>

          <View
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: "rgba(0,0,0,0.06)",
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: C.text,
                marginBottom: 6,
              }}
            >
              Demo login
            </Text>
            <Text style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>
              For the hackathon demo, tap continue to jump straight into your
              Stack&apos;d dashboard.
            </Text>
            <TouchableOpacity
              onPress={() => router.replace("/")}
              style={{
                backgroundColor: C.accent,
                borderRadius: 999,
                paddingVertical: 12,
                alignItems: "center",
              }}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  color: "white",
                  fontSize: 15,
                  fontWeight: "700",
                }}
              >
                Continue to Stack&apos;d
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text
          style={{
            fontSize: 11,
            color: C.muted,
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          Prototype only – authentication is simulated for this demo.
        </Text>
      </View>
    </SafeAreaView>
  );
}

