// Shared design system tokens + primitives for "Performance Console"
// Dark editorial sports-broadcast aesthetic.

const C = {
  bg:        'oklch(0.135 0.005 90)',
  bgDeep:    'oklch(0.10 0.005 90)',
  surface:   'oklch(0.175 0.005 90)',
  surface2:  'oklch(0.215 0.005 90)',
  hairline:  'oklch(1 0 0 / 0.08)',
  hairline2: 'oklch(1 0 0 / 0.14)',
  text:      'oklch(0.97 0.005 90)',
  textDim:   'oklch(0.75 0.005 90)',
  muted:     'oklch(0.55 0.005 90)',
  mutedDim:  'oklch(0.40 0.005 90)',
  accent:    'oklch(0.90 0.22 128)',     // electric lime
  accentDim: 'oklch(0.70 0.18 128)',
  accentInk: 'oklch(0.20 0.06 128)',
  danger:    'oklch(0.70 0.20 25)',
  warm:      'oklch(0.78 0.16 60)',
};

const FONTS = {
  ui:   "'Space Grotesk', system-ui, sans-serif",
  mono: "'JetBrains Mono', 'SF Mono', ui-monospace, monospace",
};

// Tiny mono uppercase label, used everywhere
function Eyebrow({ children, color = C.muted, style = {} }) {
  return (
    <div style={{
      fontFamily: FONTS.mono, fontSize: 10, letterSpacing: '0.14em',
      textTransform: 'uppercase', color, fontWeight: 500,
      ...style,
    }}>{children}</div>
  );
}

// Big mono number, used for hero metrics
function MetricNumber({ value, unit, size = 80, color = C.text, weight = 400 }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: 6,
      fontFamily: FONTS.mono, color, lineHeight: 0.9,
    }}>
      <span style={{ fontSize: size, fontWeight: weight, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
      {unit && (
        <span style={{ fontSize: size * 0.28, color: C.muted, fontWeight: 400, letterSpacing: '0.05em' }}>{unit}</span>
      )}
    </div>
  );
}

// Hairline divider
function HR({ style = {} }) {
  return <div style={{ height: 1, background: C.hairline, ...style }} />;
}

// Mono tag chip
function Chip({ children, active = false, accent = false, style = {} }) {
  const bg = active ? (accent ? C.accent : 'rgba(255,255,255,0.08)') : 'transparent';
  const col = active ? (accent ? C.accentInk : C.text) : C.textDim;
  const bd = active ? 'transparent' : C.hairline2;
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '6px 10px', borderRadius: 2,
      border: `1px solid ${bd}`, background: bg, color: col,
      fontFamily: FONTS.mono, fontSize: 10, letterSpacing: '0.12em',
      textTransform: 'uppercase', fontWeight: 500, whiteSpace: 'nowrap',
      ...style,
    }}>{children}</div>
  );
}

// Live dot
function LiveDot({ color = C.accent }) {
  return (
    <span style={{
      display: 'inline-block', width: 6, height: 6, borderRadius: 999,
      background: color, boxShadow: `0 0 8px ${color}`,
    }} />
  );
}

// SVG icons (stroke 1.5, sized in line)
const Ico = {
  home: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 11.5L12 4l9 7.5V20a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1v-8.5z"/>
    </svg>
  ),
  dumbbell: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12"/>
    </svg>
  ),
  flame: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2c2 4 6 5 6 11a6 6 0 11-12 0c0-3 2-4 2-7 2 2 4 2 4-4z"/>
    </svg>
  ),
  chat: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 5h16v11H8l-4 4V5z"/>
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/>
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  send: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 12l16-8-6 18-3-7-7-3z"/>
    </svg>
  ),
  cam: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>
    </svg>
  ),
  arrow: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M5 12h14M13 6l6 6-6 6"/>
    </svg>
  ),
  play: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M6 4l14 8-14 8z"/>
    </svg>
  ),
  pause: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
    </svg>
  ),
  bolt: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
      <path d="M13 2L4 14h6l-1 8 9-12h-6z"/>
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>
    </svg>
  ),
  more: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 12l5 5L20 6"/>
    </svg>
  ),
};

// Floating glass dock — bottom nav replacement
function Dock({ active = 'home' }) {
  const items = [
    { id: 'home',     ico: Ico.home,     label: 'TODAY' },
    { id: 'workout',  ico: Ico.dumbbell, label: 'TRAIN' },
    { id: 'log',      ico: Ico.plus,     label: '',       cta: true },
    { id: 'nutrition',ico: Ico.flame,    label: 'FUEL' },
    { id: 'progress', ico: Ico.chart,    label: 'STATS' },
  ];
  return (
    <div style={{
      position: 'absolute', left: 14, right: 14, bottom: 22, zIndex: 40,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 10px',
      background: 'rgba(20,20,20,0.72)',
      backdropFilter: 'blur(24px) saturate(180%)',
      WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      border: `1px solid ${C.hairline2}`,
      borderRadius: 999,
      boxShadow: '0 20px 50px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
    }}>
      {items.map((it) => {
        const isActive = active === it.id;
        if (it.cta) {
          return (
            <div key={it.id} style={{
              width: 46, height: 46, borderRadius: 999,
              background: C.accent, color: C.accentInk,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 6px 18px ${C.accent}40, inset 0 -2px 0 rgba(0,0,0,0.12)`,
            }}>
              {it.ico}
            </div>
          );
        }
        return (
          <div key={it.id} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            color: isActive ? C.text : C.muted, gap: 3, padding: '6px 0',
            position: 'relative',
          }}>
            <div style={{ color: isActive ? C.accent : C.muted }}>{it.ico}</div>
            <div style={{
              fontFamily: FONTS.mono, fontSize: 8, letterSpacing: '0.16em',
              color: isActive ? C.text : C.mutedDim, fontWeight: 500,
            }}>{it.label}</div>
            {isActive && (
              <div style={{
                position: 'absolute', bottom: -2, left: '50%', transform: 'translateX(-50%)',
                width: 4, height: 4, borderRadius: 999, background: C.accent,
                boxShadow: `0 0 6px ${C.accent}`,
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Mini sparkline (decorative)
function Sparkline({ data, w = 100, h = 28, color = C.accent, fill = false }) {
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return [x, y];
  });
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const dFill = d + ` L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      {fill && <path d={dFill} fill={color} opacity="0.12" />}
      <path d={d} stroke={color} strokeWidth="1.5" fill="none" />
    </svg>
  );
}

// Phone shell wrapper — full bleed dark
function Screen({ children, label }) {
  return (
    <div data-screen-label={label} style={{
      position: 'relative', width: '100%', height: '100%',
      background: C.bg, color: C.text,
      fontFamily: FONTS.ui, overflow: 'hidden',
    }}>
      {/* subtle grain */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(120% 60% at 50% -10%, rgba(168,232,55,0.05), transparent 60%)',
      }} />
      {children}
    </div>
  );
}

// iOS status bar override for dark theme
function StatusBar({ time = '9:41' }) {
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '18px 32px 0', height: 54, pointerEvents: 'none',
    }}>
      <div style={{ fontFamily: FONTS.mono, fontSize: 14, fontWeight: 600, color: C.text, letterSpacing: '0.02em' }}>
        {time}
      </div>
      <div style={{ width: 126 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.text }}>
        <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor"><rect x="0" y="6" width="3" height="5" rx="0.5"/><rect x="4.5" y="4" width="3" height="7" rx="0.5"/><rect x="9" y="2" width="3" height="9" rx="0.5"/><rect x="13.5" y="0" width="3" height="11" rx="0.5"/></svg>
        <svg width="24" height="11" viewBox="0 0 24 11" fill="none" stroke="currentColor" strokeOpacity="0.4"><rect x="0.5" y="0.5" width="21" height="10" rx="2.5"/><rect x="2" y="2" width="18" height="7" rx="1" fill="currentColor" stroke="none"/><path d="M22.5 4v3" stroke="currentColor" strokeOpacity="0.4"/></svg>
      </div>
    </div>
  );
}

Object.assign(window, {
  C, FONTS, Eyebrow, MetricNumber, HR, Chip, LiveDot, Ico, Dock, Sparkline, Screen, StatusBar,
});
