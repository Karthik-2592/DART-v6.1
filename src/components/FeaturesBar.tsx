import { FEATURES } from '../data'

export default function FeaturesBar() {
  return (
    <section className="features-bar">
      {FEATURES.map(({ icon: Icon, title, desc, color }) => (
        <div key={title} className="feature-item">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${color}20`, border: `1px solid ${color}40` }}
          >
            <Icon size={22} style={{ color }} />
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-bold text-slate-100">{title}</p>
            <p className="text-xs text-slate-500">{desc}</p>
          </div>
        </div>
      ))}
    </section>
  )
}
