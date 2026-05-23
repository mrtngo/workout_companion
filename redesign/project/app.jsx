// Main app: design canvas with all 6 screen artboards.

function App() {
  // Each screen on a phone-sized artboard (402 × 874 — iOS frame default)
  const sections = [
    {
      id: 'flow',
      title: 'Performance Console — Workout Companion redesign',
      subtitle: 'Dark editorial sports-broadcast aesthetic · Space Grotesk + JetBrains Mono · electric lime accent',
      artboards: [
        { id: 'home', label: 'Today',     Comp: HomeScreen },
        { id: 'log', label: 'Train',      Comp: WorkoutScreen },
        { id: 'session', label: 'Session', Comp: SessionScreen },
        { id: 'fuel', label: 'Fuel',      Comp: NutritionScreen },
        { id: 'stats', label: 'Stats',    Comp: ProgressScreen },
        { id: 'coach', label: 'Coach',    Comp: AssistantScreen },
      ],
    },
  ];

  const W = 402, H = 874;

  return (
    <DesignCanvas
      title="Workout Companion"
      subtitle="Redesign · v1"
      background="#0d0d0d"
    >
      {sections.map((sec) => (
        <DCSection key={sec.id} id={sec.id} title={sec.title} subtitle={sec.subtitle}>
          {sec.artboards.map((ab) => (
            <DCArtboard key={ab.id} id={ab.id} label={ab.label} width={W} height={H}
              style={{ background: '#0d0d0d', borderRadius: 48, overflow: 'hidden',
                       boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)' }}>
              {/* Phone-shaped artboard with the screen inside */}
              <div style={{
                position: 'relative', width: W, height: H, overflow: 'hidden',
                borderRadius: 48, background: '#000',
              }}>
                <ab.Comp />
                {/* Dynamic island */}
                <div style={{
                  position: 'absolute', top: 11, left: '50%', transform: 'translateX(-50%)',
                  width: 126, height: 37, borderRadius: 24, background: '#000', zIndex: 50,
                }} />
                {/* Home indicator */}
                <div style={{
                  position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
                  width: 139, height: 5, borderRadius: 100, background: 'rgba(255,255,255,0.7)',
                  zIndex: 60, pointerEvents: 'none',
                }} />
              </div>
            </DCArtboard>
          ))}
        </DCSection>
      ))}
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
