import { useState, useMemo } from "react";

const PAIRS = [
  "EUR/USD",
  "GBP/USD",
  "XAU/USD",
  "NAS100",
  "US30",
  "GBP/JPY",
  "EUR/GBP",
  "Other",
];
const TIMEFRAMES = ["M5", "M15", "M30", "H1", "H4", "D1"];
const POI_TYPES = ["FVG", "Order Block", "FVG + OB", "BOS/ChoCh", "Other"];
const SESSIONS = ["London", "New York", "Asian", "Overlap"];
const OUTCOMES = [
  "Win",
  "Loss",
  "Breakeven",
  "Missed (went my way)",
  "Missed (didn't play out)",
];
const HESITATION_REASONS = [
  "Candle looked wrong",
  "Feared fake-out",
  "Position size anxiety",
  "Wasn't at screen",
  "Wanted more confirmation",
  "Previous loss at similar setup",
  "Market felt uncertain",
  "Other",
];

const EMPTY_FORM = {
  date: new Date().toISOString().split("T")[0],
  pair: "",
  timeframe: "",
  session: "",
  poiType: "",
  direction: "",
  entered: "",
  hesitated: "",
  hesitationReason: "",
  outcome: "",
  rr: "",
  emotion: 3,
  confidence: 3,
  notes: "",
};

function StatCard({ label, value, sub, accent }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        padding: "20px 24px",
        borderTop: `3px solid ${accent || "#c9a84c"}`,
      }}
    >
      <div
        style={{
          color: "#888",
          fontSize: 11,
          letterSpacing: 2,
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          color: "#fff",
          fontSize: 28,
          fontFamily: "'Playfair Display', serif",
          fontWeight: 700,
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ color: "#666", fontSize: 12, marginTop: 4 }}>{sub}</div>
      )}
    </div>
  );
}

function MoodSlider({ label, value, onChange, color }) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <span style={{ color: "#888", fontSize: 12 }}>{label}</span>
        <span style={{ color: color, fontSize: 12, fontWeight: 600 }}>
          {value}/5
        </span>
      </div>
      <input
        type="range"
        min={1}
        max={5}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        style={{ width: "100%", accentColor: color }}
      />
    </div>
  );
}

function Select({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 8,
        padding: "10px 12px",
        color: value ? "#fff" : "#555",
        fontSize: 13,
        outline: "none",
        cursor: "pointer",
      }}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((o) => (
        <option key={o} value={o} style={{ background: "#1a1a2e" }}>
          {o}
        </option>
      ))}
    </select>
  );
}

function RadioGroup({ value, onChange, options }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          style={{
            padding: "8px 16px",
            borderRadius: 20,
            fontSize: 12,
            cursor: "pointer",
            border:
              value === opt
                ? "1px solid #c9a84c"
                : "1px solid rgba(255,255,255,0.1)",
            background:
              value === opt
                ? "rgba(201,168,76,0.15)"
                : "rgba(255,255,255,0.03)",
            color: value === opt ? "#c9a84c" : "#888",
            transition: "all 0.2s",
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function TradingJournal() {
  const [trades, setTrades] = useState(() => {
    try {
      const saved = localStorage.getItem("edge_journal_trades");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [form, setForm] = useState(EMPTY_FORM);
  const [view, setView] = useState("log"); // log | history | stats
  const [saved, setSaved] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const saveTrades = (updated) => {
    setTrades(updated);
    try {
      localStorage.setItem("edge_journal_trades", JSON.stringify(updated));
    } catch {}
  };

  const handleSave = () => {
    if (!form.pair || !form.outcome) return;
    saveTrades([{ ...form, id: Date.now() }, ...trades]);
    setForm({ ...EMPTY_FORM, date: new Date().toISOString().split("T")[0] });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const stats = useMemo(() => {
    if (!trades.length) return null;
    const taken = trades.filter((t) => t.entered === "Yes");
    const missed = trades.filter((t) => t.entered === "No");
    const wins = taken.filter((t) => t.outcome === "Win");
    const missedWinners = missed.filter(
      (t) => t.outcome === "Missed (went my way)",
    );
    const winRate = taken.length
      ? Math.round((wins.length / taken.length) * 100)
      : 0;
    const avgRR = taken.filter((t) => t.rr).length
      ? (
          taken.filter((t) => t.rr).reduce((a, b) => a + +b.rr, 0) /
          taken.filter((t) => t.rr).length
        ).toFixed(2)
      : "—";
    return {
      total: trades.length,
      taken: taken.length,
      missed: missed.length,
      wins: wins.length,
      winRate,
      avgRR,
      missedWinners: missedWinners.length,
    };
  }, [trades]);

  const outcomeColor = (o) => {
    if (!o) return "#555";
    if (o === "Win") return "#4ade80";
    if (o === "Loss") return "#f87171";
    if (o === "Breakeven") return "#facc15";
    if (o.includes("went my way")) return "#fb923c";
    return "#94a3b8";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d0d14",
        fontFamily: "'DM Sans', sans-serif",
        color: "#fff",
        backgroundImage:
          "radial-gradient(ellipse at 20% 20%, rgba(201,168,76,0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(99,102,241,0.04) 0%, transparent 60%)",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "20px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 22,
              color: "#c9a84c",
              letterSpacing: 1,
            }}
          >
            RADLIFE JOURNAL
          </div>
          <div
            style={{
              color: "#444",
              fontSize: 11,
              letterSpacing: 3,
              textTransform: "uppercase",
              marginTop: 2,
            }}
          >
            road2profitability
          </div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {["log", "history", "stats"].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: "8px 18px",
                borderRadius: 8,
                fontSize: 12,
                cursor: "pointer",
                textTransform: "capitalize",
                border:
                  "1px solid " +
                  (view === v
                    ? "rgba(201,168,76,0.5)"
                    : "rgba(255,255,255,0.08)"),
                background: view === v ? "rgba(201,168,76,0.1)" : "transparent",
                color: view === v ? "#c9a84c" : "#555",
                letterSpacing: 1,
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px" }}>
        {/* LOG VIEW */}
        {view === "log" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div
              style={{
                color: "#555",
                fontSize: 12,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              New Entry
            </div>

            {/* Row 1 */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr 1fr",
                gap: 12,
              }}
            >
              <div>
                <label style={lbl}>Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => set("date", e.target.value)}
                  style={{ ...inputStyle }}
                />
              </div>
              <div>
                <label style={lbl}>Pair</label>
                <Select
                  value={form.pair}
                  onChange={(v) => set("pair", v)}
                  options={PAIRS}
                  placeholder="Select pair"
                />
              </div>
              <div>
                <label style={lbl}>Timeframe</label>
                <Select
                  value={form.timeframe}
                  onChange={(v) => set("timeframe", v)}
                  options={TIMEFRAMES}
                  placeholder="TF"
                />
              </div>
              <div>
                <label style={lbl}>Session</label>
                <Select
                  value={form.session}
                  onChange={(v) => set("session", v)}
                  options={SESSIONS}
                  placeholder="Session"
                />
              </div>
            </div>

            {/* Row 2 */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <div>
                <label style={lbl}>POI Type</label>
                <RadioGroup
                  value={form.poiType}
                  onChange={(v) => set("poiType", v)}
                  options={POI_TYPES}
                />
              </div>
              <div>
                <label style={lbl}>Direction</label>
                <RadioGroup
                  value={form.direction}
                  onChange={(v) => set("direction", v)}
                  options={["Long", "Short"]}
                />
              </div>
            </div>

            {/* Row 3 */}
            <div>
              <label style={lbl}>Did you enter?</label>
              <RadioGroup
                value={form.entered}
                onChange={(v) => set("entered", v)}
                options={["Yes", "No"]}
              />
            </div>

            {form.entered === "No" && (
              <div
                style={{
                  background: "rgba(251,146,60,0.06)",
                  border: "1px solid rgba(251,146,60,0.2)",
                  borderRadius: 10,
                  padding: 16,
                }}
              >
                <label style={{ ...lbl, color: "#fb923c" }}>
                  Why did you hesitate?
                </label>
                <RadioGroup
                  value={form.hesitationReason}
                  onChange={(v) => set("hesitationReason", v)}
                  options={HESITATION_REASONS}
                />
              </div>
            )}

            {/* Outcome */}
            <div>
              <label style={lbl}>Outcome</label>
              <RadioGroup
                value={form.outcome}
                onChange={(v) => set("outcome", v)}
                options={OUTCOMES}
              />
            </div>

            {/* RR */}
            {form.entered === "Yes" && (
              <div style={{ maxWidth: 200 }}>
                <label style={lbl}>R:R Achieved</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 2.5"
                  value={form.rr}
                  onChange={(e) => set("rr", e.target.value)}
                  style={{ ...inputStyle }}
                />
              </div>
            )}

            {/* Sliders */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 20,
              }}
            >
              <MoodSlider
                label="Emotional state (1=anxious, 5=calm)"
                value={form.emotion}
                onChange={(v) => set("emotion", v)}
                color="#818cf8"
              />
              <MoodSlider
                label="Confidence in setup (1=low, 5=high)"
                value={form.confidence}
                onChange={(v) => set("confidence", v)}
                color="#c9a84c"
              />
            </div>

            {/* Notes */}
            <div>
              <label style={lbl}>Notes / Observations</label>
              <textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="What did you see? What made you hesitate? What would you do differently?"
                rows={3}
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
              />
            </div>

            <button
              onClick={handleSave}
              style={{
                background: saved
                  ? "rgba(74,222,128,0.15)"
                  : "rgba(201,168,76,0.15)",
                border: `1px solid ${saved ? "#4ade80" : "#c9a84c"}`,
                color: saved ? "#4ade80" : "#c9a84c",
                padding: "14px 32px",
                borderRadius: 10,
                fontSize: 13,
                letterSpacing: 2,
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.3s",
                alignSelf: "flex-start",
              }}
            >
              {saved ? "✓ Saved" : "Log Trade"}
            </button>
          </div>
        )}

        {/* HISTORY VIEW */}
        {view === "history" && (
          <div>
            <div
              style={{
                color: "#555",
                fontSize: 12,
                letterSpacing: 2,
                textTransform: "uppercase",
                marginBottom: 20,
              }}
            >
              Trade History — {trades.length} entries
            </div>
            {trades.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  color: "#333",
                  padding: "60px 0",
                  fontSize: 14,
                }}
              >
                No trades logged yet. Start with the Log tab.
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {trades.map((t) => (
                <div
                  key={t.id}
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 10,
                    padding: "16px 20px",
                    borderLeft: `3px solid ${outcomeColor(t.outcome)}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{ display: "flex", gap: 12, alignItems: "center" }}
                    >
                      <span
                        style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}
                      >
                        {t.pair}
                      </span>
                      <span style={{ color: "#555", fontSize: 12 }}>
                        {t.timeframe}
                      </span>
                      <span style={{ color: "#555", fontSize: 12 }}>
                        {t.session}
                      </span>
                      <span
                        style={{
                          color: "#888",
                          fontSize: 12,
                          background: "rgba(255,255,255,0.05)",
                          padding: "2px 8px",
                          borderRadius: 4,
                        }}
                      >
                        {t.poiType}
                      </span>
                      {t.direction && (
                        <span
                          style={{
                            color:
                              t.direction === "Long" ? "#4ade80" : "#f87171",
                            fontSize: 12,
                          }}
                        >
                          {t.direction}
                        </span>
                      )}
                    </div>
                    <div
                      style={{ display: "flex", gap: 12, alignItems: "center" }}
                    >
                      {t.rr && (
                        <span style={{ color: "#c9a84c", fontSize: 12 }}>
                          {t.rr}R
                        </span>
                      )}
                      <span
                        style={{
                          color: outcomeColor(t.outcome),
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {t.outcome}
                      </span>
                      <span style={{ color: "#444", fontSize: 11 }}>
                        {t.date}
                      </span>
                    </div>
                  </div>
                  {t.entered === "No" && t.hesitationReason && (
                    <div
                      style={{
                        color: "#fb923c",
                        fontSize: 12,
                        marginBottom: 4,
                      }}
                    >
                      Hesitation: {t.hesitationReason}
                    </div>
                  )}
                  {t.notes && (
                    <div
                      style={{
                        color: "#555",
                        fontSize: 12,
                        fontStyle: "italic",
                      }}
                    >
                      {t.notes}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                    <span style={{ color: "#444", fontSize: 11 }}>
                      😌 Emotion: {t.emotion}/5
                    </span>
                    <span style={{ color: "#444", fontSize: 11 }}>
                      🎯 Confidence: {t.confidence}/5
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STATS VIEW */}
        {view === "stats" && (
          <div>
            <div
              style={{
                color: "#555",
                fontSize: 12,
                letterSpacing: 2,
                textTransform: "uppercase",
                marginBottom: 20,
              }}
            >
              Overview
            </div>
            {!stats ? (
              <div
                style={{
                  textAlign: "center",
                  color: "#333",
                  padding: "60px 0",
                  fontSize: 14,
                }}
              >
                Log some trades to see your stats.
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 12,
                    marginBottom: 24,
                  }}
                >
                  <StatCard label="Total Logged" value={stats.total} />
                  <StatCard
                    label="Win Rate"
                    value={`${stats.winRate}%`}
                    sub={`${stats.wins} wins from ${stats.taken} taken`}
                    accent="#4ade80"
                  />
                  <StatCard
                    label="Avg R:R"
                    value={stats.avgRR}
                    sub="on taken trades"
                    accent="#818cf8"
                  />
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 12,
                  }}
                >
                  <StatCard label="Trades Taken" value={stats.taken} />
                  <StatCard
                    label="Trades Missed"
                    value={stats.missed}
                    accent="#fb923c"
                  />
                  <StatCard
                    label="Missed Winners"
                    value={stats.missedWinners}
                    sub="hesitated, went your way"
                    accent="#f87171"
                  />
                </div>

                {/* Hesitation breakdown */}
                {trades.filter((t) => t.hesitationReason).length > 0 && (
                  <div
                    style={{
                      marginTop: 24,
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 12,
                      padding: 20,
                    }}
                  >
                    <div
                      style={{
                        color: "#fb923c",
                        fontSize: 11,
                        letterSpacing: 2,
                        textTransform: "uppercase",
                        marginBottom: 16,
                      }}
                    >
                      Hesitation Patterns
                    </div>
                    {Object.entries(
                      trades
                        .filter((t) => t.hesitationReason)
                        .reduce((acc, t) => {
                          acc[t.hesitationReason] =
                            (acc[t.hesitationReason] || 0) + 1;
                          return acc;
                        }, {}),
                    )
                      .sort((a, b) => b[1] - a[1])
                      .map(([reason, count]) => (
                        <div
                          key={reason}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 10,
                          }}
                        >
                          <span style={{ color: "#888", fontSize: 13 }}>
                            {reason}
                          </span>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <div
                              style={{
                                width: 100,
                                height: 4,
                                background: "rgba(255,255,255,0.05)",
                                borderRadius: 2,
                              }}
                            >
                              <div
                                style={{
                                  width: `${(count / trades.filter((t) => t.hesitationReason).length) * 100}%`,
                                  height: "100%",
                                  background: "#fb923c",
                                  borderRadius: 2,
                                }}
                              />
                            </div>
                            <span
                              style={{
                                color: "#fb923c",
                                fontSize: 12,
                                minWidth: 16,
                              }}
                            >
                              {count}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const lbl = {
  display: "block",
  color: "#555",
  fontSize: 11,
  letterSpacing: 2,
  textTransform: "uppercase",
  marginBottom: 8,
};
const inputStyle = {
  width: "100%",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  padding: "10px 12px",
  color: "#fff",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
};
