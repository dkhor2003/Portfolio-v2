/**
 * Full-screen loading curtain: a cup filling with a rosetta's worth of milk.
 * Shown on boot (while the globe's land data is fetched) and between routes.
 */
export default function LatteLoader({ fading, label = 'LOADING UP…' }: { fading: boolean; label?: string }) {
  return (
    <div
      className={`fixed inset-0 z-[200] bg-ink flex flex-col items-center justify-center gap-6 transition-opacity duration-500 ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="relative w-[70px] h-[86px]">
        {[14, 31, 48].map((left, i) => (
          <div
            key={left}
            className="absolute -top-6 w-[9px] h-5 rounded-full bg-muted animate-steamRise"
            style={{ left, animationDelay: `${i * 0.4}s` }}
          />
        ))}
        <div className="absolute bottom-0 left-0 right-0 h-[70px] border-[3px] border-[rgb(var(--cup))] border-t-0 rounded-b-[20px] overflow-hidden bg-ink">
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-b from-latte to-[#a06a2e] animate-fillCup" />
        </div>
        {/* Handle. h-6.5 is not a real Tailwind step, which is why this used to
            render as a sliver. */}
        <div className="absolute -right-4 top-4 w-5 h-[26px] border-[3px] border-[rgb(var(--cup))] border-l-0 rounded-r-xl" />
      </div>
      <div className="font-mono text-xs text-dim uppercase tracking-widest">{label}</div>
    </div>
  );
}
