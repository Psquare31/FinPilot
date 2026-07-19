/* Hand-rolled, dependency-free SVG charts. */

/* ---------------- Donut ---------------- */

export function Donut({ data = [], size = 168, thickness = 20, center }) {
  const total = data.reduce((s, d) => s + (d.value || 0), 0);
  const r = (size - thickness) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;

  let offset = 0;
  const segments = total
    ? data
        .filter((d) => d.value > 0)
        .map((d) => {
          const frac = d.value / total;
          const seg = {
            color: d.color,
            dash: frac * circ,
            gap: circ - frac * circ,
            offset: -offset * circ,
          };
          offset += frac;
          return seg;
        })
    : [];

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={c} cy={c} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={thickness} />
        {segments.map((s, i) => (
          <circle
            key={i}
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={thickness}
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={s.offset}
            strokeLinecap="butt"
          />
        ))}
      </svg>
      {center && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            textAlign: "center",
          }}
        >
          {center}
        </div>
      )}
    </div>
  );
}

/* ---------------- Grouped bars (income vs expense) ---------------- */

export function GroupedBars({ series = [], height = 200, currencyFmt = (v) => v }) {
  const max = Math.max(1, ...series.map((s) => Math.max(s.income, s.expense)));
  const barW = 13;
  const groupGap = 34;
  const gap = 7;
  const chartW = Math.max(series.length * (barW * 2 + gap + groupGap), 260);
  const chartH = height;
  const base = chartH - 26;

  const scale = (v) => (v / max) * (base - 12);

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width={chartW} height={chartH} style={{ display: "block" }}>
        {[0.25, 0.5, 0.75, 1].map((g) => (
          <line
            key={g}
            x1={0}
            x2={chartW}
            y1={base - g * (base - 12)}
            y2={base - g * (base - 12)}
            stroke="var(--border)"
            strokeDasharray="3 4"
          />
        ))}
        {series.map((s, i) => {
          const gx = groupGap / 2 + i * (barW * 2 + gap + groupGap);
          const ih = scale(s.income);
          const eh = scale(s.expense);
          return (
            <g key={i}>
              <rect
                x={gx}
                y={base - ih}
                width={barW}
                height={ih}
                rx={3}
                fill="var(--green)"
              />
              <rect
                x={gx + barW + gap}
                y={base - eh}
                width={barW}
                height={eh}
                rx={3}
                fill="var(--red)"
              />
              <text
                x={gx + barW + gap / 2}
                y={chartH - 8}
                textAnchor="middle"
                fontSize="11"
                fill="var(--text-dim)"
              >
                {s.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ---------------- Area line (net cash-flow trend) ---------------- */

export function AreaLine({ points = [], height = 190, color = "var(--brand)" }) {
  const w = 640;
  const h = height;
  const padY = 22;
  if (points.length < 2) {
    return (
      <div className="dim" style={{ padding: "40px 0", textAlign: "center" }}>
        Add a few transactions to see the trend.
      </div>
    );
  }
  const values = points.map((p) => p.value);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const range = max - min || 1;

  const x = (i) => (i / (points.length - 1)) * (w - 20) + 10;
  const y = (v) => h - padY - ((v - min) / range) * (h - padY * 2);

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.value)}`).join(" ");
  const area = `${line} L${x(points.length - 1)},${h - padY} L${x(0)},${h - padY} Z`;

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#areaGrad)" />
        <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(p.value)} r="3.2" fill={color} />
            <text
              x={x(i)}
              y={h - 6}
              textAnchor="middle"
              fontSize="10.5"
              fill="var(--text-dim)"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
