import { useState, useEffect } from "react";

// Lightweight custom DatePicker - month grid with navigation.
export default function DatePicker({ value, onChange, min }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(() => {
    if (value) return new Date(value + "T00:00:00");
    return new Date();
  });
  const [selected, setSelected] = useState(value || null);

  useEffect(() => {
    setSelected(value || null);
  }, [value]);

  function startOfMonth(d) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }
  function endOfMonth(d) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
  }

  const first = startOfMonth(viewDate);
  const last = endOfMonth(viewDate);
  const startDay = first.getDay();

  const days = [];
  // build leading blanks
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), d));

  function formatYMD(date) {
    if (!date) return "";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  }

  function isBeforeMin(date) {
    if (!min) return false;
    const minDate = new Date(min + "T00:00:00");
    return date < minDate;
  }

  return (
    <div className="p-3 bg-card border border-line rounded-sm">
      <div className="flex items-center justify-between mb-3">
        <button type="button" className="px-3 py-1 bg-bg border border-line rounded-sm hover:bg-bg-alt transition-colors btn-click" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} title="Previous month">&larr; Prev</button>
        <div className="font-mono text-sm text-cream">{viewDate.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</div>
        <button type="button" className="px-3 py-1 bg-bg border border-line rounded-sm hover:bg-bg-alt transition-colors btn-click" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} title="Next month">Next &rarr;</button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-stone-dim mb-2">
        <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((d, idx) => {
          if (!d) return <div key={idx} className="h-10" />;
          const ymd = formatYMD(d);
          const disabled = isBeforeMin(d);
          const isSelected = selected === ymd;
          return (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => {
                const val = formatYMD(d);
                setSelected(val);
                onChange && onChange(val);
              }}
              className={`h-10 flex items-center justify-center rounded-sm ${disabled ? 'text-stone-dim bg-bg' : isSelected ? 'bg-gold text-bg' : 'bg-card text-cream hover:ring-2 hover:ring-gold'}`}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
