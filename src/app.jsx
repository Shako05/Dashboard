import { useState, useCallback, useRef } from "react";

const ASSETS = [
  { id: "XAUUSD", label: "XAU/USD", name: "Gold", category: "COMMODITY", searchTerms: "gold price XAU fundamental news today" },
  { id: "BTC", label: "BTC/USD", name: "Bitcoin", category: "CRYPTO", searchTerms: "Bitcoin BTC fundamental news today 2025" },
  { id: "GBPUSD", label: "GBP/USD", name: "British Pound", category: "FOREX", searchTerms: "GBP British pound Bank of England news today" },
  { id: "EURUSD", label: "EUR/USD", name: "Euro", category: "FOREX", searchTerms: "EUR Euro ECB monetary policy news today" },
  { id: "NASDAQ", label: "NASDAQ", name: "Nasdaq 100", category: "INDEX", searchTerms: "Nasdaq 100 US stocks market outlook news today" },
  { id: "SOLANA", label: "SOL/USD", name: "Solana", category: "CRYPTO", searchTerms: "Solana SOL crypto news today 2025" },
  { id: "ETH", label: "ETH/USD", name: "Ethereum", category: "CRYPTO", searchTerms: "Ethereum ETH crypto news today 2025" },
  { id: "XRP", label: "XRP/USD", name: "Ripple XRP", category: "CRYPTO", searchTerms: "XRP Ripple SEC crypto news today 2025" },
];

const CATEGORY_COLORS = {
  COMMODITY: "#f59e0b",
  CRYPTO: "#8b5cf6",
  FOREX: "#06b6d4",
  INDEX: "#10b981",
};

function BiasGauge({ score, loading }) {
  const cx = 90, cy = 88, r = 66;
  const clampedScore = Math.max(-5, Math.min(5, score ?? 0));
  const pct = (clampedScore + 5) / 10;

  const toXY = (angleDeg, radius) => {
    const rad = (180 - angleDeg) * (Math.PI / 180);
    return { x: cx + radius * Math.cos(rad), y: cy - radius * Math.sin(rad) };
  };
  const arcPath = (startDeg, endDeg, radius) => {
    const s = toXY(startDeg, radius);
    const e = toXY(endDeg, radius);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  const needleDeg = pct * 180;
  const needleTip = toXY(needleDeg, r * 0.78);
  const needleBase1 = toXY(needleDeg + 90, 7);
  const needleBase2 = toXY(needleDeg - 90, 7);

  const getColor = (s) => {
    if (s >= 2) return "#22c55e";
    if (s >= 0.5) return "#86efac";
    if (s > -0.5) return "#fbbf24";
    if (s > -2) return "#f87171";
    return "#ef4444";
  };
  const gaugeColor = getColor(clampedScore);

  return (
    <svg width="180" height="105" viewBox="0 0 180 105" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="gGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
        <filter id="nglow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <path d={arcPath(0, 180, r)} fill="none" stroke="#1e293b" strokeWidth="14" strokeLinecap="round" />
      <path d={arcPath(0, 180, r)} fill="none" stroke="url(#gGrad)" strokeWidth="14" strokeLinecap="round" strokeOpacity="0.2" />
      {!loading && (
        <path d={arcPath(0, pct * 180, r)} fill="none" stroke={gaugeColor} strokeWidth="14" strokeLinecap="round" filter="url(#nglow)" style={{ transition: "all 0.8s ease" }} />
      )}
      {[0, 45, 90, 135, 180].map((deg) => {
        const outer = toXY(deg, r + 10); const inner = toXY(deg, r + 4);
        return <line key={deg} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="#334155" strokeWidth="1.5" />;
      })}
      {!loading && (
        <polygon points={`${needleTip.x},${needleTip.y} ${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y}`} fill={gaugeColor} filter="url(#nglow)" style={{ transition: "all 0.8s ease" }} />
      )}
      {loading && (
        <path d={arcPath(0, 110, r)} fill="none" stroke="#1e3a5f" strokeWidth="14" strokeLinecap="round"
          style={{ transformOrigin: `${cx}px ${cy}px`, animation: "spinG 1.4s linear infinite" }} />
      )}
      <circle cx={cx} cy={cy} r="7" fill="#0f172a" stroke="#334155" strokeWidth="2" />
      <circle cx={cx} cy={cy} r="3.5" fill={loading ? "#334155" : gaugeColor} />
    </svg>
  );
}

function AssetCard({ asset, data, loading, status, onAnalyze }) {
  const catColor = CATEGORY_COLORS[asset.category];
  const score = data?.score ?? 0;

  const biasLabel = data && !data.error
    ? score >= 3 ? "STRONG BULLISH" : score >= 1 ? "BULLISH" : score > -1 ? "NEUTRAL" : score > -3 ? "BEARISH" : "STRONG BEARISH"
    : null;

  const biasColor = data && !data.error
    ? score >= 1 ? "#22c55e" : score > -1 ? "#fbbf24" : "#ef4444"
    : "#475569";

  return (
    <div style={{
      background: "linear-gradient(135deg, #0d1421 0%, #0a0f1a 100%)",
      border: `1px solid ${data?.error ? "#7f1d1d40" : "#1e2d40"}`,
      borderTop: `2px solid ${data?.error ? "#ef444440" : catColor + "40"}`,
      borderRadius: "12px", padding: "20px",
      display: "flex", flexDirection: "column", gap: "10px",
      position: "relative", overflow: "hidden",
      animation: "fadeIn 0.4s ease",
    }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.025, backgroundImage: "linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)", backgroundSize: "20px 20px", pointerEvents: "none" }} />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "18px", fontWeight: "700", color: "#e2e8f0", letterSpacing: "0.05em" }}>{asset.label}</span>
            <span style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "4px", background: `${catColor}18`, color: catColor, fontFamily: "monospace", letterSpacing: "0.1em", border: `1px solid ${catColor}30` }}>{asset.category}</span>
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px", fontFamily: "monospace" }}>{asset.name}</div>
        </div>
        {biasLabel && (
          <span style={{ fontSize: "10px", fontFamily: "'Share Tech Mono', monospace", color: biasColor, border: `1px solid ${biasColor}50`, padding: "3px 8px", borderRadius: "4px", letterSpacing: "0.08em", background: `${biasColor}10` }}>{biasLabel}</span>
        )}
      </div>

      {/* Gauge */}
      {!data?.error && (
        <div style={{ display: "flex", justifyContent: "center", margin: "-8px 0 -12px" }}>
          <BiasGauge score={data?.score} loading={loading} />
        </div>
      )}

      {/* Center content */}
      <div style={{ textAlign: "center", marginTop: data?.error ? 0 : "-4px" }}>
        {data && !loading && !data.error && (
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "28px", fontWeight: "700", color: biasColor, textShadow: `0 0 20px ${biasColor}60` }}>
            {data.score > 0 ? "+" : ""}{Number(data.score).toFixed(1)}
          </span>
        )}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
            <span style={{ fontFamily: "monospace", fontSize: "11px", color: "#fbbf24", letterSpacing: "0.2em", animation: "pulse 1.2s ease infinite" }}>{status || "ANALYZING..."}</span>
          </div>
        )}
        {data?.error && (
          <div style={{ padding: "10px 0" }}>
            <div style={{ fontSize: "11px", color: "#ef4444", letterSpacing: "0.1em", marginBottom: "6px" }}>⚠ ANALYSE MISLUKT</div>
            <div style={{ fontSize: "10px", color: "#64748b", marginBottom: "10px", lineHeight: "1.5" }}>{data.summary}</div>
            <button onClick={() => onAnalyze(asset.id)} style={{ background: "#1e293b", border: "1px solid #334155", color: "#94a3b8", padding: "6px 14px", borderRadius: "6px", fontFamily: "monospace", fontSize: "10px", cursor: "pointer", letterSpacing: "0.1em" }}>↺ OPNIEUW PROBEREN</button>
          </div>
        )}
        {!data && !loading && (
          <span style={{ fontFamily: "monospace", fontSize: "11px", color: "#334155", letterSpacing: "0.15em" }}>IN WACHTRIJ</span>
        )}
      </div>

      {/* Key factors */}
      {data?.keyFactors && !data.error && (
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          {data.keyFactors.map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "6px", fontSize: "10px", color: "#64748b", fontFamily: "monospace", lineHeight: "1.4" }}>
              <span style={{ color: catColor, flexShrink: 0 }}>›</span><span>{f}</span>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {data?.summary && !data.error && (
        <div style={{ fontSize: "11px", color: "#94a3b8", lineHeight: "1.6", borderTop: "1px solid #1e293b", paddingTop: "10px", fontFamily: "monospace" }}>{data.summary}</div>
      )}

      {/* Sources */}
      {data?.sources && !data.error && data.sources.length > 0 && (
        <div>
          <div style={{ fontSize: "9px", color: "#334155", fontFamily: "monospace", marginBottom: "4px", letterSpacing: "0.08em" }}>BRONNEN ({data.sourceCount ?? data.sources.length}):</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
            {data.sources.slice(0, 15).map((s, i) => (
              <span key={i} style={{ fontSize: "8px", padding: "2px 5px", borderRadius: "3px", background: "#0f172a", border: "1px solid #1e293b", color: "#475569", fontFamily: "monospace" }}>{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Analyze button */}
      {!data && !loading && (
        <button onClick={() => onAnalyze(asset.id)} style={{ background: `${catColor}15`, border: `1px solid ${catColor}40`, color: catColor, borderRadius: "6px", padding: "8px", fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", cursor: "pointer", letterSpacing: "0.15em" }}>ANALYZE ›</button>
      )}

      {data?.timestamp && !data.error && (
        <div style={{ fontSize: "9px", color: "#334155", fontFamily: "monospace", textAlign: "right" }}>⏱ {data.timestamp}</div>
      )}
    </div>
  );
}

async function fetchBias(asset, signal) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("nl-NL", { year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });

  const response = await fetch("../api/analyze.js", {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      system: `You are an expert financial analyst. Today is ${dateStr} at ${timeStr} (Brussels/Amsterdam time).

Analyze the fundamental bias for a trading asset. You MUST do AT LEAST 5 different web searches covering:
1. Latest news & price action for the asset
2. Central bank policy / institutional news / macro data
3. Sentiment from a second angle (e.g. different outlet or aspect)
4. Any upcoming events, data releases, or catalysts
5. Broader market context affecting this asset

After all searches, respond ONLY with a raw JSON object (NO markdown, NO backticks, NO preamble):
{
  "score": <float -5.0 to 5.0>,
  "summary": "<2-3 sentences: current fundamental picture based on what you actually found today>",
  "keyFactors": ["<factor 1 with specific data/numbers>", "<factor 2>", "<factor 3>"],
  "sources": ["Reuters", "Bloomberg", "CoinDesk", ... up to 15 source names],
  "sourceCount": <integer>
}`,
      messages: [{
        role: "user",
        content: `Determine fundamental bias for ${asset.id} (${asset.name}). Date/time: ${timeStr} on ${dateStr}. Start searching: "${asset.searchTerms}". Do multiple searches. Return ONLY the JSON object.`
      }]
    })
  });

  if (!response.ok) {
    const txt = await response.text().catch(() => "");
    throw new Error(`HTTP ${response.status}${txt ? ": " + txt.slice(0, 120) : ""}`);
  }

  const data = await response.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));

  const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
  const match = text.replace(/```json|```/g, "").trim().match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Geen geldige JSON in response");
  const parsed = JSON.parse(match[0]);
  if (typeof parsed.score !== "number") throw new Error("Ongeldige JSON structuur");
  return parsed;
}

async function runConcurrent(items, limit, onStart, onDone) {
  const queue = [...items];
  const worker = async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      onStart(item);
      try {
        const result = await item.fn();
        onDone(item.id, result, null);
      } catch (e) {
        onDone(item.id, null, e);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}

export default function BiasDashboard() {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});
  const [statuses, setStatuses] = useState({});
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const timers = useRef({});
  const controllers = useRef({});

  const startStatusCycle = (id) => {
    clearInterval(timers.current[id]);
    const msgs = ["SEARCHING NEWS...", "READING MARKETS...", "CHECKING MACRO...", "ANALYZING SENTIMENT...", "COMPUTING BIAS..."];
    let i = 0;
    setStatuses(p => ({ ...p, [id]: msgs[0] }));
    timers.current[id] = setInterval(() => {
      i = (i + 1) % msgs.length;
      setStatuses(p => ({ ...p, [id]: msgs[i] }));
    }, 5000);
  };

  const stopStatusCycle = (id) => clearInterval(timers.current[id]);

  const analyzeAsset = useCallback(async (assetId) => {
    const asset = ASSETS.find(a => a.id === assetId);
    if (controllers.current[assetId]) controllers.current[assetId].abort();
    const ctrl = new AbortController();
    controllers.current[assetId] = ctrl;

    setLoading(p => ({ ...p, [assetId]: true }));
    setResults(p => { const n = { ...p }; delete n[assetId]; return n; });
    startStatusCycle(assetId);

    const timeout = setTimeout(() => ctrl.abort(), 100000);
    try {
      const result = await fetchBias(asset, ctrl.signal);
      stopStatusCycle(assetId);
      clearTimeout(timeout);
      setResults(p => ({ ...p, [assetId]: { ...result, timestamp: new Date().toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" }) } }));
    } catch (e) {
      stopStatusCycle(assetId);
      clearTimeout(timeout);
      if (e.name !== "AbortError") {
        setResults(p => ({ ...p, [assetId]: { error: true, summary: e.message || "Onbekende fout", timestamp: new Date().toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" }) } }));
      }
    } finally {
      setLoading(p => ({ ...p, [assetId]: false }));
    }
  }, []);

  const analyzeAll = useCallback(async () => {
    if (isRunningAll) return;
    setIsRunningAll(true);
    setResults({});
    setLastRefresh(new Date().toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" }));

    const items = ASSETS.map(asset => ({
      id: asset.id,
      fn: async () => {
        const ctrl = new AbortController();
        controllers.current[asset.id] = ctrl;
        const timeout = setTimeout(() => ctrl.abort(), 100000);
        try {
          const result = await fetchBias(asset, ctrl.signal);
          clearTimeout(timeout);
          return result;
        } catch (e) {
          clearTimeout(timeout);
          throw e;
        }
      }
    }));

    await runConcurrent(
      items,
      2, // Only 2 at a time to avoid rate limits
      (item) => {
        setLoading(p => ({ ...p, [item.id]: true }));
        startStatusCycle(item.id);
      },
      (id, result, err) => {
        stopStatusCycle(id);
        setLoading(p => ({ ...p, [id]: false }));
        const ts = new Date().toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
        if (err && err.name !== "AbortError") {
          setResults(p => ({ ...p, [id]: { error: true, summary: err.message || "Onbekende fout", timestamp: ts } }));
        } else if (result) {
          setResults(p => ({ ...p, [id]: { ...result, timestamp: ts } }));
        }
      }
    );

    setIsRunningAll(false);
  }, [isRunningAll]);

  const anyLoading = Object.values(loading).some(Boolean);
  const okCount = Object.values(results).filter(r => !r?.error).length;
  const errCount = Object.values(results).filter(r => r?.error).length;

  return (
    <div style={{ minHeight: "100vh", background: "#060a12", padding: "24px", fontFamily: "'Share Tech Mono', monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Barlow+Condensed:wght@400;600;700&display=swap');
        @keyframes spinG { to { transform: rotate(-360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        *{box-sizing:border-box;margin:0;padding:0}
        button:hover{opacity:0.85}
      `}</style>

      <div style={{ maxWidth: "1340px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", paddingBottom: "20px", borderBottom: "1px solid #1e293b", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: anyLoading ? "#fbbf24" : "#22c55e", boxShadow: `0 0 12px ${anyLoading ? "#fbbf24" : "#22c55e"}`, animation: anyLoading ? "pulse 1s ease infinite" : "none" }} />
              <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "26px", fontWeight: "700", letterSpacing: "0.12em", color: "#e2e8f0" }}>FUNDAMENTAL BIAS SCANNER</h1>
            </div>
            <div style={{ marginTop: "6px", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: "10px", color: "#475569", letterSpacing: "0.06em" }}>🔴 LIVE WEB DATA · 5+ ZOEKOPDRACHTEN · 10-20 BRONNEN PER ASSET</span>
              {lastRefresh && <span style={{ fontSize: "10px", color: "#334155" }}>LAATSTE SCAN: {lastRefresh}</span>}
              {okCount > 0 && <span style={{ fontSize: "10px", color: "#22c55e" }}>✓ {okCount}/{ASSETS.length}</span>}
              {errCount > 0 && <span style={{ fontSize: "10px", color: "#ef4444" }}>✗ {errCount} FOUTEN</span>}
            </div>
          </div>
          <button onClick={analyzeAll} disabled={anyLoading} style={{ background: anyLoading ? "#0d1421" : "linear-gradient(135deg,#1d4ed8,#1e40af)", border: anyLoading ? "1px solid #334155" : "1px solid #3b82f6", color: anyLoading ? "#475569" : "#bfdbfe", padding: "12px 22px", borderRadius: "8px", fontFamily: "'Share Tech Mono',monospace", fontSize: "12px", cursor: anyLoading ? "not-allowed" : "pointer", letterSpacing: "0.15em", transition: "all 0.2s", boxShadow: anyLoading ? "none" : "0 0 24px #1d4ed840" }}>
            {anyLoading ? `⏳ SCANNING...` : "▶  SCAN ALL ASSETS"}
          </button>
        </div>

        {/* Scale legend */}
        <div style={{ marginBottom: "20px", padding: "10px 16px", background: "#080d16", borderRadius: "8px", border: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
            {[["STRONG BEAR","#ef4444","−5/−3"],["BEARISH","#f87171","−3/−1"],["NEUTRAL","#fbbf24","±1"],["BULLISH","#86efac","+1/+3"],["STRONG BULL","#22c55e","+3/+5"]].map(([label,color,range]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: color }} />
                <span style={{ fontSize: "9px", color, letterSpacing: "0.07em" }}>{label}</span>
                <span style={{ fontSize: "9px", color: "#334155" }}>{range}</span>
              </div>
            ))}
          </div>
          <span style={{ fontSize: "9px", color: "#334155" }}>⚡ 2 assets tegelijk · ~4-6 min totaal</span>
        </div>

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "16px" }}>
          {ASSETS.map(asset => (
            <AssetCard key={asset.id} asset={asset} data={results[asset.id]} loading={!!loading[asset.id]} status={statuses[asset.id]} onAnalyze={analyzeAsset} />
          ))}
        </div>

        <div style={{ marginTop: "28px", paddingTop: "14px", borderTop: "1px solid #0d1421", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: "9px", color: "#1e293b" }}>FOR INFORMATIONAL PURPOSES ONLY — NOT FINANCIAL ADVICE</span>
          <span style={{ fontSize: "9px", color: "#1e293b" }}>AI BIAS SCANNER v2.0</span>
        </div>
      </div>
    </div>
  );
}
