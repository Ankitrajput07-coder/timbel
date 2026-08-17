export default function DaySelector({ selectedDay, onSelect }) {
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

  return (
    <div className="flex flex-wrap gap-2">
      {days.map((day) => {
        const isSelected = selectedDay === day
        const isSunday = day === 'SUN'

        if (isSunday) {
          return (
            <button
              key={day}
              disabled
              title="Holiday"
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-darker/50 border border-slate-border/50 text-red-400/70 cursor-not-allowed flex items-center gap-1.5"
            >
              {day} <span className="text-[10px] uppercase tracking-wider font-bold bg-red-400/10 px-1.5 py-0.5 rounded text-red-400">Holiday</span>
            </button>
          )
        }

        return (
          <button
            key={day}
            onClick={() => onSelect(day)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
              isSelected
                ? 'bg-violet-primary text-white shadow-lg shadow-violet-primary/20 scale-105'
                : 'bg-slate-darker border border-slate-border text-text-muted hover:text-text-primary hover:border-violet-primary/50'
            }`}
          >
            {day}
          </button>
        )
      })}
    </div>
  )
}
