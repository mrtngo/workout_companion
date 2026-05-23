// All 6 screens for the workout app redesign — "Performance Console"

// ============================================================
// 1. HOME / TODAY
// ============================================================
function HomeScreen() {
  return (
    <Screen label="01 Today">
      <StatusBar />
      <div style={{ padding: '70px 22px 120px', height: '100%', boxSizing: 'border-box', overflow: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <Eyebrow>Mon · May 23 · 09:41</Eyebrow>
            <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 4 }}>
              Morning, Alex.
            </div>
          </div>
          <div style={{
            width: 38, height: 38, borderRadius: 999, border: `1px solid ${C.hairline2}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: FONTS.mono, fontSize: 12, color: C.text, fontWeight: 500,
          }}>AT</div>
        </div>

        {/* Readiness Hero */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <Eyebrow>Readiness</Eyebrow>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <LiveDot />
              <Eyebrow color={C.text}>Live · Whoop</Eyebrow>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <MetricNumber value="84" size={108} weight={300} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '3px 7px', borderRadius: 2, background: C.accent, color: C.accentInk,
                  fontFamily: FONTS.mono, fontSize: 10, fontWeight: 600, letterSpacing: '0.04em',
                }}>
                  {Ico.bolt} PRIMED
                </div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: C.muted }}>
                  +6 vs avg
                </div>
              </div>
            </div>
            {/* Mini ring */}
            <div style={{ position: 'relative', width: 88, height: 88 }}>
              <svg width="88" height="88" viewBox="0 0 88 88" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="44" cy="44" r="38" fill="none" stroke={C.hairline2} strokeWidth="2" />
                <circle cx="44" cy="44" r="38" fill="none" stroke={C.accent} strokeWidth="2"
                  strokeDasharray={`${0.84 * 238.7} 238.7`} strokeLinecap="butt" />
              </svg>
            </div>
          </div>

          {/* 4-col data strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', marginTop: 24,
                        borderTop: `1px solid ${C.hairline}`, borderBottom: `1px solid ${C.hairline}` }}>
            {[
              ['HRV', '62', 'ms'],
              ['RHR', '54', 'bpm'],
              ['SLEEP', '7.4', 'h'],
              ['STRAIN', '11.2', ''],
            ].map(([l, v, u], i) => (
              <div key={l} style={{
                padding: '14px 8px', borderRight: i < 3 ? `1px solid ${C.hairline}` : 'none',
              }}>
                <Eyebrow>{l}</Eyebrow>
                <div style={{ fontFamily: FONTS.mono, fontSize: 18, marginTop: 6, letterSpacing: '-0.02em' }}>
                  {v}<span style={{ color: C.muted, fontSize: 11, marginLeft: 2 }}>{u}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Workout */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <Eyebrow>Programmed today</Eyebrow>
            <Eyebrow color={C.textDim}>Block 2 · Wk 3</Eyebrow>
          </div>

          <div style={{
            background: C.surface, border: `1px solid ${C.hairline}`,
            padding: 18, position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: 4, height: '100%', background: C.accent }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: C.accent, letterSpacing: '0.16em', marginBottom: 6 }}>
                  PUSH · HEAVY
                </div>
                <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.05 }}>
                  Chest & Triceps
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: FONTS.mono, fontSize: 22, letterSpacing: '-0.02em' }}>62′</div>
                <Eyebrow style={{ marginTop: 2 }}>est.</Eyebrow>
              </div>
            </div>

            {/* Exercise list */}
            <div style={{ borderTop: `1px solid ${C.hairline}`, paddingTop: 12 }}>
              {[
                ['01', 'Bench Press', '5 × 5', '85kg'],
                ['02', 'Incline DB Press', '4 × 8', '32kg'],
                ['03', 'Cable Fly', '3 × 12', '20kg'],
                ['04', 'Tricep Pushdown', '3 × 15', '40kg'],
              ].map(([n, name, sets, w]) => (
                <div key={n} style={{
                  display: 'grid', gridTemplateColumns: '24px 1fr auto auto',
                  alignItems: 'center', gap: 12, padding: '8px 0',
                  borderBottom: `1px solid ${C.hairline}`,
                }}>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: C.muted }}>{n}</div>
                  <div style={{ fontSize: 14, color: C.text }}>{name}</div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: C.textDim }}>{sets}</div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: C.accent, minWidth: 40, textAlign: 'right' }}>{w}</div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button style={{
              marginTop: 14, width: '100%', padding: '14px 16px',
              background: C.accent, color: C.accentInk, border: 'none',
              fontFamily: FONTS.mono, fontSize: 12, fontWeight: 600, letterSpacing: '0.14em',
              textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 8, cursor: 'pointer',
            }}>
              Start session {Ico.arrow}
            </button>
          </div>
        </div>

        {/* Today's intake */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <Eyebrow>Intake</Eyebrow>
            <Eyebrow color={C.textDim}>1,842 / 2,400 kcal</Eyebrow>
          </div>
          <div style={{ display: 'flex', gap: 4, height: 6, background: C.hairline, marginBottom: 12 }}>
            <div style={{ width: '38%', background: C.accent }} />
            <div style={{ width: '24%', background: C.warm }} />
            <div style={{ width: '15%', background: '#9b88ff' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {[['Protein','142g','170g'],['Carbs','186g','280g'],['Fat','58g','78g']].map(([l, v, t]) => (
              <div key={l}>
                <Eyebrow>{l}</Eyebrow>
                <div style={{ fontFamily: FONTS.mono, fontSize: 16, marginTop: 4 }}>
                  {v}<span style={{ color: C.muted, fontSize: 10 }}> / {t}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Dock active="home" />
    </Screen>
  );
}

// ============================================================
// 2. WORKOUT LOG
// ============================================================
function WorkoutScreen() {
  const sessions = [
    { d: '05.22', day: 'YST', name: 'Pull · Heavy', dur: '58′', vol: '12.4t', sets: 18, prs: 1, top: 'Deadlift 140kg' },
    { d: '05.20', day: 'SAT', name: 'Legs · Volume', dur: '71′', vol: '14.8t', sets: 22, prs: 2, top: 'Squat 110kg' },
    { d: '05.19', day: 'FRI', name: 'Push · Heavy', dur: '64′', vol: '10.1t', sets: 19, prs: 0, top: 'Bench 85kg' },
    { d: '05.17', day: 'WED', name: 'Pull · Volume', dur: '52′', vol: '11.2t', sets: 21, prs: 0, top: 'Row 70kg' },
    { d: '05.15', day: 'MON', name: 'Push · Volume', dur: '49′', vol: '9.6t', sets: 18, prs: 1, top: 'OHP 55kg' },
  ];
  return (
    <Screen label="02 Train">
      <StatusBar />
      <div style={{ padding: '70px 22px 120px', height: '100%', boxSizing: 'border-box', overflow: 'auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <Eyebrow>Training log</Eyebrow>
          <div style={{ fontSize: 34, fontWeight: 400, letterSpacing: '-0.03em', marginTop: 6 }}>
            Sessions
          </div>
        </div>

        {/* Weekly snapshot */}
        <div style={{
          border: `1px solid ${C.hairline}`, padding: 16, marginBottom: 22,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.02), transparent)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <Eyebrow>This week</Eyebrow>
            <Sparkline data={[2,3,1,4,2,5,3]} w={80} h={20} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {[['SESSIONS','5','/6'],['VOLUME','58.1','tonnes'],['PRs','4','']].map(([l, v, u]) => (
              <div key={l}>
                <Eyebrow>{l}</Eyebrow>
                <div style={{ fontFamily: FONTS.mono, fontSize: 26, marginTop: 4, letterSpacing: '-0.03em' }}>
                  {v}<span style={{ color: C.muted, fontSize: 11, marginLeft: 2 }}>{u}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filter row */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto' }}>
          <Chip active>All</Chip>
          <Chip>Push</Chip>
          <Chip>Pull</Chip>
          <Chip>Legs</Chip>
          <Chip>Core</Chip>
        </div>

        {/* Session rows */}
        <div>
          {sessions.map((s, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '52px 1fr auto',
              gap: 14, padding: '16px 0', borderBottom: `1px solid ${C.hairline}`,
              alignItems: 'center',
            }}>
              <div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 9, color: C.muted, letterSpacing: '0.12em' }}>{s.day}</div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 14, color: C.text, marginTop: 2 }}>{s.d}</div>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, color: C.text, marginBottom: 4 }}>{s.name}</div>
                <div style={{ display: 'flex', gap: 10, fontFamily: FONTS.mono, fontSize: 10, color: C.muted, letterSpacing: '0.08em' }}>
                  <span>{s.dur}</span>
                  <span style={{ color: C.mutedDim }}>·</span>
                  <span>{s.vol}</span>
                  <span style={{ color: C.mutedDim }}>·</span>
                  <span>{s.sets} SETS</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {s.prs > 0 ? (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '3px 6px', background: C.accent, color: C.accentInk,
                    fontFamily: FONTS.mono, fontSize: 9, fontWeight: 600, letterSpacing: '0.1em',
                  }}>{Ico.bolt} {s.prs} PR</div>
                ) : (
                  <div style={{ color: C.mutedDim }}>{Ico.arrow}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <Dock active="workout" />
    </Screen>
  );
}

// ============================================================
// 3. WORKOUT IN SESSION (live)
// ============================================================
function SessionScreen() {
  return (
    <Screen label="03 Session">
      <StatusBar />
      <div style={{ padding: '64px 0 120px', height: '100%', boxSizing: 'border-box', overflow: 'auto' }}>
        {/* Sticky header strip */}
        <div style={{
          padding: '8px 22px 14px', borderBottom: `1px solid ${C.hairline}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LiveDot color={C.danger} />
            <Eyebrow color={C.danger}>Recording</Eyebrow>
          </div>
          <div style={{ fontFamily: FONTS.mono, fontSize: 14, letterSpacing: '0.02em' }}>32:14</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ width: 32, height: 32, border: `1px solid ${C.hairline2}`, display:'flex', alignItems:'center', justifyContent:'center', color: C.textDim }}>
              {Ico.pause}
            </div>
            <div style={{ width: 32, height: 32, border: `1px solid ${C.hairline2}`, display:'flex', alignItems:'center', justifyContent:'center', color: C.textDim }}>
              {Ico.more}
            </div>
          </div>
        </div>

        <div style={{ padding: '22px 22px 0' }}>
          {/* Exercise + progress */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <Eyebrow>Exercise 02 / 04</Eyebrow>
            <Eyebrow color={C.accent}>Heavy block</Eyebrow>
          </div>
          <div style={{ fontSize: 32, fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1.05 }}>
            Incline DB Press
          </div>
          <div style={{ marginTop: 4, fontFamily: FONTS.mono, fontSize: 11, color: C.muted, letterSpacing: '0.08em' }}>
            CHEST · PRIMARY · 30° INCLINE
          </div>

          {/* Sets grid */}
          <div style={{ marginTop: 22 }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '40px 1fr 1fr 60px 36px',
              gap: 8, padding: '0 4px 8px', borderBottom: `1px solid ${C.hairline}`,
            }}>
              <Eyebrow>Set</Eyebrow>
              <Eyebrow>Weight</Eyebrow>
              <Eyebrow>Reps</Eyebrow>
              <Eyebrow>RPE</Eyebrow>
              <div />
            </div>

            {[
              { n: '01', w: '28', r: '8', rpe: '7', done: true },
              { n: '02', w: '30', r: '8', rpe: '8', done: true },
              { n: '03', w: '32', r: '7', rpe: '9', done: true, pr: true },
              { n: '04', w: '32', r: '_', rpe: '_', done: false, current: true },
            ].map((s) => (
              <div key={s.n} style={{
                display: 'grid', gridTemplateColumns: '40px 1fr 1fr 60px 36px',
                gap: 8, padding: '14px 4px', alignItems: 'center',
                borderBottom: `1px solid ${C.hairline}`,
                background: s.current ? 'rgba(168,232,55,0.06)' : 'transparent',
                position: 'relative',
              }}>
                {s.current && <div style={{ position: 'absolute', left: -22, top: 0, bottom: 0, width: 2, background: C.accent }} />}
                <div style={{ fontFamily: FONTS.mono, fontSize: 14, color: s.current ? C.accent : C.text }}>
                  {s.n}
                </div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 18, color: s.current ? C.text : C.textDim, letterSpacing: '-0.02em' }}>
                  {s.w}<span style={{ fontSize: 10, color: C.muted, marginLeft: 2 }}>kg</span>
                </div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 18, color: s.current ? C.text : C.textDim, letterSpacing: '-0.02em' }}>
                  {s.r}
                </div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 13, color: s.current ? C.text : C.muted }}>
                  @{s.rpe}
                </div>
                <div style={{
                  width: 24, height: 24,
                  border: s.done ? 'none' : `1px solid ${C.hairline2}`,
                  background: s.done ? C.accent : 'transparent',
                  color: s.done ? C.accentInk : C.muted,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {s.done && Ico.check}
                  {s.pr && <div style={{
                    position: 'absolute', marginTop: -34, marginLeft: 28,
                    fontFamily: FONTS.mono, fontSize: 8, color: C.accent, letterSpacing: '0.1em',
                  }}>PR</div>}
                </div>
              </div>
            ))}
          </div>

          {/* Rest timer + log set */}
          <div style={{
            marginTop: 20, padding: 16, border: `1px solid ${C.hairline}`,
            background: C.surface, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <Eyebrow>Rest</Eyebrow>
              <div style={{ fontFamily: FONTS.mono, fontSize: 38, letterSpacing: '-0.03em', lineHeight: 1, marginTop: 4 }}>
                01:24
              </div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: C.muted, marginTop: 4, letterSpacing: '0.08em' }}>
                TARGET 02:00
              </div>
            </div>
            <div style={{ position: 'relative', width: 64, height: 64 }}>
              <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="32" cy="32" r="28" fill="none" stroke={C.hairline2} strokeWidth="2" />
                <circle cx="32" cy="32" r="28" fill="none" stroke={C.accent} strokeWidth="2"
                  strokeDasharray={`${0.7 * 175.9} 175.9`} />
              </svg>
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: C.accent,
              }}>{Ico.play}</div>
            </div>
          </div>

          <button style={{
            marginTop: 12, width: '100%', padding: '16px',
            background: C.accent, color: C.accentInk, border: 'none',
            fontFamily: FONTS.mono, fontSize: 12, fontWeight: 600, letterSpacing: '0.18em',
            textTransform: 'uppercase', cursor: 'pointer',
          }}>
            Log set 4 → 32kg · 8 reps
          </button>
        </div>
      </div>
    </Screen>
  );
}

// ============================================================
// 4. NUTRITION
// ============================================================
function NutritionScreen() {
  const meals = [
    { time: '07:42', name: 'Skyr + berries + granola', kcal: 420, p: 38, c: 52, f: 8, tag: 'BREAKFAST' },
    { time: '10:15', name: 'Black coffee', kcal: 5, p: 0, c: 0, f: 0, tag: 'SNACK' },
    { time: '12:50', name: 'Chicken rice bowl', kcal: 685, p: 58, c: 72, f: 18, tag: 'LUNCH' },
    { time: '15:30', name: 'Whey shake + banana', kcal: 280, p: 30, c: 28, f: 4, tag: 'POST-WO' },
    { time: '19:20', name: 'Salmon, sweet potato, salad', kcal: 452, p: 42, c: 34, f: 22, tag: 'DINNER' },
  ];
  const macros = [
    { l: 'Protein', v: 168, t: 170, c: C.accent },
    { l: 'Carbs',   v: 186, t: 280, c: C.warm },
    { l: 'Fat',     v: 52,  t: 78,  c: '#9b88ff' },
  ];
  return (
    <Screen label="04 Fuel">
      <StatusBar />
      <div style={{ padding: '70px 22px 120px', height: '100%', boxSizing: 'border-box', overflow: 'auto' }}>
        <div style={{ marginBottom: 22 }}>
          <Eyebrow>Fuel · Monday</Eyebrow>
          <div style={{ fontSize: 34, fontWeight: 400, letterSpacing: '-0.03em', marginTop: 6 }}>
            Intake
          </div>
        </div>

        {/* Calorie hero */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, marginBottom: 24 }}>
          <div style={{ flex: 1 }}>
            <Eyebrow>Calories</Eyebrow>
            <MetricNumber value="1,842" size={56} weight={300} />
            <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: C.muted, marginTop: 6 }}>
              558 remaining · target 2,400
            </div>
          </div>
          {/* 3 macro rings */}
          <div style={{ display: 'flex', gap: 6 }}>
            {macros.map((m, i) => {
              const pct = m.v / m.t;
              return (
                <div key={i} style={{ position: 'relative', width: 44, height: 44 }}>
                  <svg width="44" height="44" viewBox="0 0 44 44" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="22" cy="22" r="18" fill="none" stroke={C.hairline2} strokeWidth="2.5" />
                    <circle cx="22" cy="22" r="18" fill="none" stroke={m.c} strokeWidth="2.5"
                      strokeDasharray={`${Math.min(pct,1) * 113.1} 113.1`} strokeLinecap="butt" />
                  </svg>
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: FONTS.mono, fontSize: 10, color: C.textDim,
                  }}>{m.l[0]}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Macro breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0,
                      border: `1px solid ${C.hairline}`, marginBottom: 26 }}>
          {macros.map((m, i) => (
            <div key={m.l} style={{
              padding: 14, borderRight: i < 2 ? `1px solid ${C.hairline}` : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span style={{ width: 6, height: 6, background: m.c, display: 'block' }} />
                <Eyebrow>{m.l}</Eyebrow>
              </div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 20, letterSpacing: '-0.02em' }}>
                {m.v}<span style={{ color: C.muted, fontSize: 11 }}>g</span>
              </div>
              <div style={{ marginTop: 8, height: 2, background: C.hairline }}>
                <div style={{ height: '100%', width: `${Math.min(m.v/m.t,1)*100}%`, background: m.c }} />
              </div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 9, color: C.muted, marginTop: 6, letterSpacing: '0.08em' }}>
                {m.v}/{m.t}g
              </div>
            </div>
          ))}
        </div>

        {/* Quick log input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
          border: `1px solid ${C.hairline2}`, marginBottom: 22,
        }}>
          <div style={{ color: C.accent }}>{Ico.plus}</div>
          <div style={{ flex: 1, fontFamily: FONTS.mono, fontSize: 12, color: C.muted, letterSpacing: '0.04em' }}>
            "I had a chicken bowl..." — log via AI
          </div>
          <div style={{ color: C.textDim }}>{Ico.cam}</div>
        </div>

        {/* Meals */}
        <Eyebrow style={{ marginBottom: 12 }}>Today's intake · 5</Eyebrow>
        <div>
          {meals.map((m, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '52px 1fr auto',
              gap: 12, padding: '14px 0', borderBottom: `1px solid ${C.hairline}`, alignItems: 'flex-start',
            }}>
              <div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 13, color: C.text }}>{m.time}</div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 8, color: C.muted, marginTop: 2, letterSpacing: '0.1em' }}>{m.tag}</div>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, color: C.text, marginBottom: 4 }}>{m.name}</div>
                <div style={{ display: 'flex', gap: 10, fontFamily: FONTS.mono, fontSize: 10, color: C.muted }}>
                  <span>P {m.p}</span>
                  <span>C {m.c}</span>
                  <span>F {m.f}</span>
                </div>
              </div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 16, color: C.text }}>
                {m.kcal}<span style={{ color: C.muted, fontSize: 9, marginLeft: 1 }}>kcal</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Dock active="nutrition" />
    </Screen>
  );
}

// ============================================================
// 5. PROGRESS / STATS
// ============================================================
function ProgressScreen() {
  // build a chart path
  const data = [62, 65, 68, 67, 72, 75, 78, 80, 82, 85, 83, 88];
  const w = 358, h = 140;
  const max = 100, min = 50;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * w,
    h - ((v - min) / (max - min)) * h,
  ]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const fill = line + ` L ${w} ${h} L 0 ${h} Z`;

  return (
    <Screen label="05 Stats">
      <StatusBar />
      <div style={{ padding: '70px 22px 120px', height: '100%', boxSizing: 'border-box', overflow: 'auto' }}>
        <div style={{ marginBottom: 22 }}>
          <Eyebrow>Performance</Eyebrow>
          <div style={{ fontSize: 34, fontWeight: 400, letterSpacing: '-0.03em', marginTop: 6 }}>
            Trends
          </div>
        </div>

        {/* Range chips */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 22 }}>
          <Chip>1W</Chip>
          <Chip active accent>3M</Chip>
          <Chip>6M</Chip>
          <Chip>1Y</Chip>
          <Chip>ALL</Chip>
        </div>

        {/* Hero chart */}
        <div style={{
          border: `1px solid ${C.hairline}`, padding: 16, marginBottom: 22,
          background: C.surface,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <Eyebrow>Bench press · 1RM est.</Eyebrow>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
                <MetricNumber value="102" unit="kg" size={42} weight={400} />
                <div style={{
                  fontFamily: FONTS.mono, fontSize: 11, color: C.accent,
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                }}>
                  ↑ 12.4%
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', color: C.muted }}>
              {Ico.search}
              <Eyebrow color={C.muted}>Bench</Eyebrow>
            </div>
          </div>

          <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
            <defs>
              <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={C.accent} stopOpacity="0.25" />
                <stop offset="1" stopColor={C.accent} stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Gridlines */}
            {[0,0.25,0.5,0.75,1].map(p => (
              <line key={p} x1="0" x2={w} y1={p*h} y2={p*h} stroke={C.hairline} strokeWidth="1" />
            ))}
            <path d={fill} fill="url(#ag)" />
            <path d={line} stroke={C.accent} strokeWidth="1.5" fill="none" />
            {pts.map((p, i) => (
              <circle key={i} cx={p[0]} cy={p[1]} r={i === pts.length-1 ? 3 : 0} fill={C.accent} />
            ))}
          </svg>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontFamily: FONTS.mono, fontSize: 9, color: C.muted, marginTop: 6, letterSpacing: '0.08em',
          }}>
            <span>FEB</span><span>MAR</span><span>APR</span><span>MAY</span>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 0,
          border: `1px solid ${C.hairline}`, marginBottom: 22,
        }}>
          {[
            ['Sessions','58','this quarter'],
            ['Avg / wk','4.6','+0.3'],
            ['Streak','12','days'],
            ['Volume','512t','+8% mom'],
          ].map(([l, v, s], i) => (
            <div key={l} style={{
              padding: 16, borderRight: i % 2 === 0 ? `1px solid ${C.hairline}` : 'none',
              borderBottom: i < 2 ? `1px solid ${C.hairline}` : 'none',
            }}>
              <Eyebrow>{l}</Eyebrow>
              <div style={{ fontFamily: FONTS.mono, fontSize: 28, letterSpacing: '-0.03em', marginTop: 6 }}>
                {v}
              </div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: C.muted, marginTop: 4, letterSpacing: '0.06em' }}>
                {s}
              </div>
            </div>
          ))}
        </div>

        {/* PR leaderboard */}
        <Eyebrow style={{ marginBottom: 10 }}>Personal records</Eyebrow>
        <div>
          {[
            ['DEADLIFT', '140', 'kg', '05.22', true],
            ['SQUAT', '110', 'kg', '05.20', true],
            ['BENCH', '85', 'kg', '05.05', false],
            ['OHP', '55', 'kg', '04.28', false],
            ['ROW', '70', 'kg', '04.21', false],
          ].map(([n, v, u, d, fresh]) => (
            <div key={n} style={{
              display: 'grid', gridTemplateColumns: '1fr auto auto',
              alignItems: 'center', gap: 12, padding: '12px 0',
              borderBottom: `1px solid ${C.hairline}`,
            }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 13, letterSpacing: '0.08em' }}>{n}</div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 18, color: fresh ? C.accent : C.text, letterSpacing: '-0.02em' }}>
                {v}<span style={{ color: C.muted, fontSize: 10, marginLeft: 2 }}>{u}</span>
              </div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: C.muted, minWidth: 36, textAlign: 'right' }}>{d}</div>
            </div>
          ))}
        </div>
      </div>
      <Dock active="progress" />
    </Screen>
  );
}

// ============================================================
// 6. ASSISTANT
// ============================================================
function AssistantScreen() {
  return (
    <Screen label="06 Assistant">
      <StatusBar />
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
        {/* Header */}
        <div style={{ padding: '64px 22px 18px', borderBottom: `1px solid ${C.hairline}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <Eyebrow>Coach</Eyebrow>
              <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 4 }}>
                Conversation
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <LiveDot />
              <Eyebrow color={C.textDim}>Gemini · context loaded</Eyebrow>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px 140px' }}>
          {/* User */}
          <div style={{ marginBottom: 26 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Eyebrow>You</Eyebrow>
              <Eyebrow color={C.mutedDim}>09:38</Eyebrow>
            </div>
            <div style={{ fontSize: 15, lineHeight: 1.45, color: C.text }}>
              I'm feeling a bit beat up from yesterday's pull session. Should I push through legs today or swap?
            </div>
          </div>

          {/* AI */}
          <div style={{ marginBottom: 26, paddingLeft: 14, borderLeft: `2px solid ${C.accent}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Eyebrow color={C.accent}>Coach</Eyebrow>
              <Eyebrow color={C.mutedDim}>09:39</Eyebrow>
            </div>
            <div style={{ fontSize: 15, lineHeight: 1.5, color: C.text, marginBottom: 12 }}>
              Your readiness is <span style={{ color: C.accent, fontFamily: FONTS.mono }}>84</span>, HRV dropped 8% vs your 7d avg. I'd swap heavy squats for a mobility + Z2 cardio block today, then hit legs hard Wednesday when recovery rebounds.
            </div>

            {/* Inline action card */}
            <div style={{
              border: `1px solid ${C.hairline}`, padding: 12,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <Eyebrow>Proposed swap</Eyebrow>
                <div style={{ fontSize: 13, marginTop: 4 }}>Legs · Heavy → Recovery · Z2 40′</div>
              </div>
              <button style={{
                padding: '8px 12px', background: C.accent, color: C.accentInk,
                border: 'none', fontFamily: FONTS.mono, fontSize: 10, fontWeight: 600, letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}>Apply</button>
            </div>
          </div>

          {/* User */}
          <div style={{ marginBottom: 26 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Eyebrow>You</Eyebrow>
              <Eyebrow color={C.mutedDim}>09:40</Eyebrow>
            </div>
            <div style={{ fontSize: 15, lineHeight: 1.45 }}>
              Yeah do it. What should I eat after?
            </div>
          </div>

          {/* AI typing */}
          <div style={{ paddingLeft: 14, borderLeft: `2px solid ${C.accent}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Eyebrow color={C.accent}>Coach</Eyebrow>
              <Eyebrow color={C.mutedDim}>typing</Eyebrow>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[0,1,2].map(i => (
                <span key={i} style={{
                  width: 6, height: 6, borderRadius: 999, background: C.accent, opacity: 0.5,
                }} />
              ))}
            </div>
          </div>
        </div>

        {/* Input dock */}
        <div style={{
          position: 'absolute', left: 14, right: 14, bottom: 22,
          background: 'rgba(20,20,20,0.85)', backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: `1px solid ${C.hairline2}`,
          borderRadius: 999, padding: '8px 8px 8px 16px',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{ color: C.muted }}>{Ico.cam}</div>
          <div style={{ flex: 1, fontFamily: FONTS.ui, fontSize: 13, color: C.muted }}>
            Ask anything…
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: 999, background: C.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accentInk,
          }}>{Ico.send}</div>
        </div>
      </div>
    </Screen>
  );
}

Object.assign(window, {
  HomeScreen, WorkoutScreen, SessionScreen, NutritionScreen, ProgressScreen, AssistantScreen,
});
