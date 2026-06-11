/* Inline icon set — stroke-based, inherits currentColor */

const ICON_PATHS = {
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  clipboard:
    'M9 4h6m-7 0a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2M9 4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 8h6m-6 4h4',
  boxes:
    'M12 3 4 7v10l8 4 8-4V7l-8-4Zm0 0v8m8-4-8 4-8-4',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v5l3 3',
  unplug:
    'M8 7 5 4M7 8 4 5m12 11 3 3m-2-4 3 3M9 12a4 4 0 0 0 6 3.5L9.5 9A4 4 0 0 0 9 12Zm6-1a4 4 0 0 0-6-3.5L14.5 13c.3-.6.5-1.3.5-2Z',
  pulse: 'M3 12h4l2-7 4 14 2-7h6',
  chart: 'M4 20V9m5.5 11V4M15 20v-8m5 8V7M3 20h18',
  code: 'm8 8-5 4 5 4m8-8 5 4-5 4m-3-11-2 14',
  report:
    'M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm7 0v5h5M10 13h6m-6 4h4',
  monitor:
    'M4 4h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm5 16h6m-3-4v4M7 12l2.5-3 2.5 2 3.5-4',
  stores:
    'M4 9 5.5 4h13L20 9M4 9v11h16V9M4 9h16M9 20v-6h6v6',
  plug: 'M9 7V3m6 4V3M7 7h10v4a5 5 0 0 1-10 0V7Zm5 9v5',
  brain:
    'M12 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5.2A3 3 0 0 0 9 17c0 1.7 1.3 3 3 3s3-1.3 3-3a3 3 0 0 0 2-4.8A3 3 0 0 0 15 7a3 3 0 0 0-3-3Zm0 0v16',
  gears:
    'M9 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-2v2m0 8v2m-5.6-8.5 1.7 1m7.8 4.5 1.7 1M3.4 13.5l1.7-1m7.8-4.5 1.7-1M17 13a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm0-1.5V13m0 7v1.5',
  shield:
    'M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6l-7-3Zm-3 9 2 2 4-4',
  users:
    'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7 0a3 3 0 1 0-2-5.2M3 20c0-3 2.7-5 6-5s6 2 6 5m2-5c2.4.4 4 2 4 5',
  cloud:
    'M7 18a4 4 0 0 1-.5-8A5.5 5.5 0 0 1 17 8.5 4.5 4.5 0 0 1 17 18H7Z',
  spark:
    'M12 3v4m0 10v4m9-9h-4M7 12H3m13.7-5.7-2.9 2.9m-3.6 3.6-2.9 2.9m11.4 0-2.9-2.9M9.2 9.2 6.3 6.3',
  layers: 'm12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5m-18 4 9 5 9-5',
  handshake:
    'm5 9-3 3 5 5c1 1 2.5 1 3.5 0l.5-.5m-6-7.5 4-4h5l4 4m-13 0h4m9 3 3-3-5-5m2 8-5 5c-1 1-2.5 1-3.5 0L8 16',
  compass:
    'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm3.5-12.5-2 5-5 2 2-5 5-2Z',
}

export const Icon = ({ name, size = 22 }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={ICON_PATHS[name]} />
  </svg>
)
