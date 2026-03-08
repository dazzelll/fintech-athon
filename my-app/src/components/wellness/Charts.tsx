import React, { useState } from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, Circle, Text as SvgText, Defs, LinearGradient, Stop, Line } from "react-native-svg";
import { C, fmt } from './constants'; // Make sure fmt is exported from constants or use inline formatting

export function LineChart({ data, assets = [], color = C.accent }: any) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const W = 320, H = 140; // Increased height slightly to accommodate the beautiful curve
  if (!data || data.length === 0) {
    return null;
  }

  const vals = data.map((d: any) => d.v);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1; 

  const pts = data.map((d: any, i: number) => ({
    x: 10 + (data.length === 1 ? 0 : (i / (data.length - 1)) * (W - 20)),
    y: H - 20 - ((d.v - min) / span) * (H - 40),
    ...d,
  }));

  const areaPath = pts
    .map((p: any, i: number) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const area = `${areaPath} L${pts[pts.length - 1].x},${H - 2} L${pts[0].x},${H - 2} Z`;

  const firstFutureIdx = pts.findIndex((p: any) => p.isFuture);
  const hasPrediction = firstFutureIdx > 0 && firstFutureIdx < pts.length;

  const buildPath = (segment: any[]) =>
    segment
      .map((p: any, i: number) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(" ");

  const pastPts = hasPrediction ? pts.slice(0, firstFutureIdx + 1) : pts;
  const futurePts = hasPrediction ? pts.slice(firstFutureIdx) : [];

  const pastPath = buildPath(pastPts);
  const futurePath = futurePts.length > 1 ? buildPath(futurePts) : "";

  const boundaryX = hasPrediction ? pts[firstFutureIdx].x : null;

  // --- Scrubber Logic ---
  const handleTouch = (evt: any) => {
    const locX = evt.nativeEvent.locationX;
    // Find the closest data point to the user's finger
    let closestIdx = 0;
    let minDist = Infinity;
    pts.forEach((p: any, i: number) => {
      const dist = Math.abs(p.x - locX);
      if (dist < minDist) {
        minDist = dist;
        closestIdx = i;
      }
    });
    setActiveIndex(closestIdx);
  };

  const activePoint = activeIndex !== null ? pts[activeIndex] : null;

  return (
    <View 
      style={{ position: 'relative', marginTop: 10 }}
      onTouchStart={handleTouch}
      onTouchMove={handleTouch}
      onTouchEnd={() => setActiveIndex(null)}
    >
      <Svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
        <Defs>
          <LinearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Area under curve */}
        <Path d={area} fill="url(#lg)" />

        {/* Past trajectory */}
        <Path
          d={pastPath}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Future / projected trajectory (dashed) */}
        {hasPrediction && futurePath && (
          <Path
            d={futurePath}
            fill="none"
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="6 6"
            opacity={0.8}
          />
        )}

        {/* Vertical line indicating "NOW" */}
        {hasPrediction && boundaryX !== null && (
          <>
            <Path
              d={`M${boundaryX},5 L${boundaryX},${H - 18}`}
              stroke="#ef4444" // A sharp red to make the NOW line pop
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
            <SvgText
              x={boundaryX}
              y={0}
              textAnchor="middle"
              fill="#ef4444"
              fontSize="10"
              fontFamily="System"
              fontWeight="800"
            >
              NOW
            </SvgText>
          </>
        )}

        {/* X-Axis Month labels */}
        {pts.map((p: any, i: number) => (
          <SvgText
            key={i}
            x={p.x}
            y={H + 12}
            textAnchor="middle"
            fill={C.muted}
            fontSize="10"
            fontFamily="System"
            fontWeight="600"
          >
            {p.m}
          </SvgText>
        ))}

        {/* The active scrubber vertical line and dot */}
        {activePoint && (
          <>
            <Line 
              x1={activePoint.x} y1={activePoint.y} 
              x2={activePoint.x} y2={H - 15} 
              stroke={color} strokeWidth={1} strokeDasharray="3 3" opacity={0.5} 
            />
            <Circle cx={activePoint.x} cy={activePoint.y} r="6" fill={color} stroke="white" strokeWidth="3" />
          </>
        )}

        {/* Highlight latest point (only if not scrubbing) */}
        {!activePoint && (
          <Circle
            cx={pts[pts.length - 1].x}
            cy={pts[pts.length - 1].y}
            r="5"
            fill={color}
            stroke="white"
            strokeWidth="2.5"
          />
        )}
      </Svg>

      {/* Floating Interactive Tooltip (Rendered outside SVG so it can contain native React Native text/layout) */}
      {activePoint && (
        <View
          style={{
            position: 'absolute',
            top: -30,
            // Keep tooltip within screen bounds
            left: Math.min(Math.max(10, activePoint.x - 75), W - 160),
            backgroundColor: 'white',
            padding: 12,
            borderRadius: 12,
            width: 160,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.15,
            shadowRadius: 10,
            elevation: 8,
            zIndex: 100,
            borderWidth: 1,
            borderColor: '#f3f4f6'
          }}
        >
          <Text style={{ fontSize: 12, color: C.muted, fontWeight: '700', marginBottom: 2, textTransform: 'uppercase' }}>
            {activePoint.m} {activePoint.isFuture ? '(Forecast)' : ''}
          </Text>
          <Text style={{ fontSize: 20, fontWeight: '900', color: C.text, marginBottom: 8 }}>
            ${activePoint.v.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </Text>

          {/* Dynamic Asset Breakdown Math */}
          {assets && assets.length > 0 && assets.map((a: any, i: number) => {
            if (a.pct === 0) return null;
            const estimatedAssetVal = activePoint.v * (a.pct / 100);
            return (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: a.color }} />
                  <Text style={{ fontSize: 11, color: C.muted, fontWeight: '600' }}>{a.name}</Text>
                </View>
                <Text style={{ fontSize: 11, fontWeight: '800', color: C.text }}>
                  ${estimatedAssetVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

export function DonutChart({ assets, size = 130 }: any) {
  // Minor font fixes applied here as well so the $487K perfectly matches the LineChart
  const cx = size / 2, cy = size / 2, r = size * 0.4, inner = size * 0.25;
  let cum = -Math.PI / 2;
  const total = assets.reduce((s: number, a: any) => s + a.value, 0);
  const slices = assets.map((a: any) => {
    const ang = (a.value / total) * 2 * Math.PI;
    const s2 = cum; cum += ang;
    const x1 = cx + r * Math.cos(s2), y1 = cy + r * Math.sin(s2);
    const x2 = cx + r * Math.cos(cum), y2 = cy + r * Math.sin(cum);
    const ix1 = cx + inner * Math.cos(cum), iy1 = cy + inner * Math.sin(cum);
    const ix2 = cx + inner * Math.cos(s2), iy2 = cy + inner * Math.sin(s2);
    const lg = ang > Math.PI ? 1 : 0;
    return { ...a, d: `M${x1},${y1} A${r},${r} 0 ${lg},1 ${x2},${y2} L${ix1},${iy1} A${inner},${inner} 0 ${lg},0 ${ix2},${iy2} Z` };
  });

  return (
    <Svg width={size} height={size}>
      {slices.map((s: any, i: number) => <Path key={i} d={s.d} fill={s.color} opacity="0.9" />)}
      <Circle cx={cx} cy={cy} r={inner - 1} fill="white" />
      <SvgText x={cx} y={cy - 2} textAnchor="middle" fill={C.text} fontSize={14} fontFamily="System" fontWeight="900">
        ${total >= 1000 ? (total / 1000).toFixed(0) + 'K' : total}
      </SvgText>
      <SvgText x={cx} y={cy + 12} textAnchor="middle" fill={C.muted} fontSize={10} fontFamily="System" fontWeight="600">
        Total
      </SvgText>
    </Svg>
  );
}