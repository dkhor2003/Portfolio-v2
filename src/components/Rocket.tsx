import { motion } from 'motion/react'

/**
 * Side-view rocket, nose pointing right at 0deg so `offset-rotate: auto` aims
 * it along its flight path.
 *
 * Shaded graphite rather than flat colour — it sits next to the wireframe globe,
 * and a cartoon would read as pasted on. The only chroma is the accent, in the
 * window glint and the plume, so it belongs to the page's palette.
 */
export default function Rocket({ thrust = 1 }: { thrust?: number }) {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full overflow-visible">
      <defs>
        {/* Vertical ramp fakes a cylinder: shadowed rim, specular band, core. */}
        <linearGradient id="rk-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#41464e" />
          <stop offset="18%" stopColor="#9aa1ad" />
          <stop offset="34%" stopColor="#eef1f6" />
          <stop offset="58%" stopColor="#b6bcc7" />
          <stop offset="82%" stopColor="#5c626c" />
          <stop offset="100%" stopColor="#2f333a" />
        </linearGradient>
        <linearGradient id="rk-nose" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6c727c" />
          <stop offset="40%" stopColor="#cfd5df" />
          <stop offset="100%" stopColor="#3a3e45" />
        </linearGradient>
        <linearGradient id="rk-fin" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#23262c" />
          <stop offset="100%" stopColor="#4a505a" />
        </linearGradient>
        <radialGradient id="rk-plume" cx="1" cy="0.5" r="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="22%" stopColor="#c8fbff" />
          <stop offset="55%" stopColor="#4dd9d0" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#2aa8c8" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Plume, behind the hull. Scaled rather than animating the `rx`
          attribute, which motion resolves to undefined on the first frame. */}
      <motion.ellipse
        cx="6"
        cy="32"
        rx={18 * thrust}
        ry={7 * thrust}
        fill="url(#rk-plume)"
        style={{ transformOrigin: '16px 32px' }}
        animate={{ scaleX: [1, 1.45, 1.1], opacity: [0.95, 0.6, 0.9] }}
        transition={{ duration: 0.14, repeat: Infinity }}
      />

      {/* Fins, behind the hull so only their outer halves show. */}
      <path d="M20 25 L27 8 L35 25 Z" fill="url(#rk-fin)" />
      <path d="M20 39 L27 56 L35 39 Z" fill="url(#rk-fin)" />

      {/* Engine bell. */}
      <path d="M7 26.5 L16 23.5 L16 40.5 L7 37.5 Z" fill="#23262b" />
      <path d="M7 26.5 L11 27.8 L11 36.2 L7 37.5 Z" fill="#14171b" />

      {/* Hull, tapering into the nose. */}
      <path
        d="M14 23 H41 C49 24 56.5 27.5 60.5 32 C56.5 36.5 49 40 41 41 H14 C11 41 10 38.5 10 32 C10 25.5 11 23 14 23 Z"
        fill="url(#rk-body)"
      />
      {/* Nose cap, a shade cooler than the barrel. */}
      <path d="M43 23.4 C50.5 24.5 57 28 60.5 32 C57 36 50.5 39.5 43 40.6 Z" fill="url(#rk-nose)" />

      {/* Panel seams. */}
      <path d="M22 23.4 V40.6 M31 23.6 V40.4" stroke="#2c3038" strokeWidth="0.7" opacity="0.55" />
      {/* Specular highlight along the shoulder. */}
      <path d="M15 26.6 H41 C47 27.3 52.5 29.4 56 31.4" stroke="#ffffff" strokeWidth="1.1" opacity="0.4" fill="none" />

      {/* Porthole. */}
      <circle cx="36" cy="32" r="4.1" fill="#0d1216" />
      <circle cx="36" cy="32" r="4.1" fill="none" stroke="#8f96a2" strokeWidth="1" />
      <circle cx="36" cy="32" r="2.5" fill="#4dd9d0" opacity="0.75" />
      <circle cx="34.9" cy="30.9" r="1" fill="#eafcff" opacity="0.9" />
    </svg>
  )
}
