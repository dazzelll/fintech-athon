import React, { useState, useEffect, useRef } from "react";
import { View, Text, Dimensions } from "react-native";
import Svg, { Path, Ellipse, Text as SvgText, Defs, RadialGradient, Stop, G } from "react-native-svg";
import { lighten, C } from "./constants";

// ─── STRICT PROPORTION PHYSICS ────────────────────────────────────────────────
const GRAVITY = 0.04;       // Strong pull to clump them tightly together
const DAMPING = 0.70;       // High friction
const COLLISION_SQUISH = 0.85; // Allow centers to overlap slightly so the edges mold together

export function FloatingBlob({ asset, baseRadius, size, x, y, onTap, peers, containerW, containerH }: any) {
  const tickRef = useRef(Math.random() * 100);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      tickRef.current += 1;
      setTick(tickRef.current);
    }, 40);
    return () => clearInterval(id);
  }, []);

  const t = tickRef.current * 0.06;
  const cx = size / 2, cy = size / 2;
  
  const numPoints = 32; 
  const pts = Array.from({ length: numPoints }).map((_, i) => {
    const a = (i / numPoints) * Math.PI * 2;
    
    // FIX: Removed the 1.6x expansion. They now stay strictly true to their mathematical area
    const wobble = 0.04 * Math.sin(t + a * 3 + i);
    let edgeDist = baseRadius * (1.0 + wobble);

    // Wall flattening
    const padding = 3;
    if (Math.cos(a) < 0) edgeDist = Math.min(edgeDist, (x - padding) / -Math.cos(a));
    if (Math.cos(a) > 0) edgeDist = Math.min(edgeDist, (containerW - x - padding) / Math.cos(a));
    if (Math.sin(a) < 0) edgeDist = Math.min(edgeDist, (y - padding) / -Math.sin(a));
    if (Math.sin(a) > 0) edgeDist = Math.min(edgeDist, (containerH - y - padding) / Math.sin(a));

    // Peer flattening (molding edges)
    peers.forEach((peer: any) => {
      if (peer.asset.name === asset.name) return;
      
      const dx = peer.x - x;
      const dy = peer.y - y;
      const distToPeer = Math.sqrt(dx * dx + dy * dy);
      const angleToPeer = Math.atan2(dy, dx);
      const angleDiff = a - angleToPeer;

      if (Math.cos(angleDiff) > 0.01) {
        const sizeRatio = baseRadius / (baseRadius + peer.r);
        const distToBoundary = (distToPeer * sizeRatio) / Math.cos(angleDiff);
        edgeDist = Math.min(edgeDist, distToBoundary - 1.5);
      }
    });

    return [cx + edgeDist * Math.cos(a), cy + edgeDist * Math.sin(a)];
  });

  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], np = pts[(i + 1) % pts.length];
    const cp1 = [p[0] + (np[0] - pts[(i - 1 + pts.length) % pts.length][0]) * 0.15,
                 p[1] + (np[1] - pts[(i - 1 + pts.length) % pts.length][1]) * 0.15];
    const cp2 = [np[0] - (pts[(i + 2) % pts.length][0] - p[0]) * 0.15,
                 np[1] - (pts[(i + 2) % pts.length][1] - p[1]) * 0.15];
    d += ` C${cp1[0].toFixed(1)},${cp1[1].toFixed(1)} ${cp2[0].toFixed(1)},${cp2[1].toFixed(1)} ${np[0].toFixed(1)},${np[1].toFixed(1)}`;
  }

  const gid = `g_${asset.name.replace(/\s/g, "")}`;
  const eyeSize = Math.max(10, baseRadius * 0.35); // Keep eyes legible on tiny blobs

  return (
    <View style={{ position: "absolute", left: x - size/2, top: y - size/2, width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <RadialGradient id={gid} cx="35%" cy="30%" r="70%">
            <Stop offset="0%" stopColor={lighten(asset.color, 0.4)} />
            <Stop offset="100%" stopColor={asset.color} />
          </RadialGradient>
        </Defs>

        <G onPress={() => onTap(asset)}>
          <Path d={d} fill={`url(#${gid})`} />
          <Ellipse cx={cx * 0.8} cy={cy * 0.7} rx={baseRadius * 0.4} ry={baseRadius * 0.2} fill="rgba(255,255,255,0.3)" transform={`rotate(-15, ${cx}, ${cy})`} />
          
          <SvgText x={cx} y={cy + eyeSize*0.2} fontSize={eyeSize} textAnchor="middle" fill="white" fontWeight="900">
            {asset.mood === "happy" ? ">    <" : "⊙  ⊙"}
          </SvgText>
          <SvgText x={cx} y={cy + eyeSize*0.9} fontSize={eyeSize * 0.8} textAnchor="middle" fill="white">
             {asset.mood === "happy" ? "ᗜ" : "口"}
          </SvgText>
        </G>
      </Svg>
    </View>
  );
}

export function BlobEcosystem({ assets, onBlobTap }: any) {
  type Particle = {
    asset: any;
    r: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
  };
  const containerH = 340;
  const containerW = Dimensions.get('window').width - 64; 
  const centerX = containerW / 2;
  const centerY = containerH / 2;

  // We set base area to 60% of container so they clump nicely without being forced to stretch into corners
  const usablePixelArea = (containerW * containerH) * 0.60; 

  // Helper: build particles from the latest assets so blob taps always use fresh values
  const buildParticles = (srcAssets: any[]): Particle[] => {
    const totalWealth = srcAssets.reduce((sum: number, a: any) => sum + (a.value || 0), 0) || 1;
    return srcAssets.slice(0, 5).map((asset: any, index: number) => {
      const percentage = (asset.value || 0) / totalWealth;
      const blobArea = usablePixelArea * percentage;
      const r = Math.max(12, Math.sqrt(blobArea / Math.PI)); 
      const angle = (index / 5) * Math.PI * 2;
      return {
        asset,
        r,
        x: centerX + Math.cos(angle) * 40,
        y: centerY + Math.sin(angle) * 40,
        vx: 0,
        vy: 0,
      };
    });
  };

  const [particles, setParticles] = useState<Particle[]>(() => buildParticles(assets));

  // Rebuild particle asset references whenever the portfolio data changes
  useEffect(() => {
    setParticles((prev) => {
      // Preserve existing positions/velocities when possible, but update asset payloads
      const nextBase = buildParticles(assets);
      if (!prev || prev.length === 0) return nextBase;

      return nextBase.map((p, idx) => {
        const prevP = prev[idx];
        return prevP
          ? { ...p, x: prevP.x, y: prevP.y, vx: prevP.vx, vy: prevP.vy }
          : p;
      });
    });
  }, [assets, usablePixelArea, centerX, centerY]);

  useEffect(() => {
    const interval = setInterval(() => {
      setParticles((prev: Particle[]) => {
        const next: Particle[] = prev.map((p: Particle) => ({ ...p }));

        for (let p of next) {
          p.vx += (centerX - p.x) * GRAVITY;
          p.vy += (centerY - p.y) * GRAVITY;
          p.vx *= DAMPING;
          p.vy *= DAMPING;
          p.x += p.vx;
          p.y += p.vy;
        }

        for (let iter = 0; iter < 3; iter++) { 
          for (let i = 0; i < next.length; i++) {
            for (let j = i + 1; j < next.length; j++) {
              const b1 = next[i], b2 = next[j];
              
              let dx = b2.x - b1.x;
              let dy = b2.y - b1.y;
              if (dx === 0 && dy === 0) { dx = Math.random() - 0.5; dy = Math.random() - 0.5; }

              const dist = Math.sqrt(dx * dx + dy * dy); 
              const targetDist = (b1.r + b2.r) * COLLISION_SQUISH; 

              if (dist < targetDist) {
                const overlap = targetDist - dist;
                const nx = dx / dist;
                const ny = dy / dist;

                const totalR = b1.r + b2.r;
                const r1Ratio = b2.r / totalR;
                const r2Ratio = b1.r / totalR;

                b1.x -= nx * overlap * r1Ratio;
                b1.y -= ny * overlap * r1Ratio;
                b2.x += nx * overlap * r2Ratio;
                b2.y += ny * overlap * r2Ratio;

                b1.vx -= nx * overlap * 0.1 * r1Ratio;
                b1.vy -= ny * overlap * 0.1 * r1Ratio;
                b2.vx += nx * overlap * 0.1 * r2Ratio;
                b2.vy += ny * overlap * 0.1 * r2Ratio;
              }
            }
          }
        }
        return next;
      });
    }, 16); 
    return () => clearInterval(interval);
  }, [containerW, centerX, centerY]);

  return (
    <View>
      {/* ─── THE PUZZLE TANK ─── */}
      <View style={{ width: "100%", height: containerH, backgroundColor: "#EBF3FF", borderRadius: 24, overflow: "hidden", borderWidth: 2, borderColor: "#D0E1F9" }}>
        {particles.map((p: Particle) => (
          <FloatingBlob
            key={p.asset.name}
            asset={p.asset}
            baseRadius={p.r}
            size={p.r * 3} // Sufficient canvas for the squish without huge overlaps
            x={p.x}
            y={p.y}
            peers={particles}
            containerW={containerW}
            containerH={containerH}
            onTap={onBlobTap}
          />
        ))}
      </View>

      {/* ─── THE PROPORTION BAR ─── */}
      <View style={{ marginTop: 20 }}>
        <View style={{ flexDirection: "row", height: 14, borderRadius: 7, overflow: "hidden", backgroundColor: "rgba(0,0,0,0.05)" }}>
          {assets.map((a: any) => (
            <View key={`bar-${a.name}`} style={{ width: `${a.pct}%`, backgroundColor: a.color, borderRightWidth: 1, borderRightColor: "rgba(255,255,255,0.3)" }} />
          ))}
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 12, marginTop: 14 }}>
          {assets.map((a: any) => (
            <View key={`legend-${a.name}`} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: a.color }} />
              <Text style={{ fontSize: 12, fontWeight: "600", color: C.text }}>
                {a.name} <Text style={{ color: C.muted, fontWeight: "400" }}>{a.pct}%</Text>
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}