/**
 * MultiStopInput — add/remove/reorder intermediate stops
 * Each stop has: address, optional lat/lng
 */
import { Plus, Trash2, GripVertical, MapPin } from 'lucide-react'

export default function MultiStopInput({ stops, onChange }) {
  const addStop = () => onChange([...stops, { addr: '', lat: '', lng: '' }])

  const removeStop = (i) => onChange(stops.filter((_, idx) => idx !== i))

  const updateStop = (i, field, value) => {
    const updated = stops.map((s, idx) => idx === i ? { ...s, [field]: value } : s)
    onChange(updated)
  }

  const moveUp = (i) => {
    if (i === 0) return
    const arr = [...stops]
    ;[arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]
    onChange(arr)
  }

  const moveDown = (i) => {
    if (i === stops.length - 1) return
    const arr = [...stops]
    ;[arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]
    onChange(arr)
  }

  return (
    <div className="space-y-2">
      {stops.map((stop, i) => (
        <div key={i} className="flex items-start gap-2 animate-fade-in">
          {/* Stop number */}
          <div className="flex flex-col items-center gap-1 pt-2.5 shrink-0">
            <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center justify-center text-xs font-bold">
              {i + 1}
            </div>
            {stops.length > 1 && (
              <div className="flex flex-col gap-0.5">
                <button onClick={() => moveUp(i)} disabled={i === 0}
                  className="text-slate-300 hover:text-slate-500 disabled:opacity-20 text-xs leading-none">▲</button>
                <button onClick={() => moveDown(i)} disabled={i === stops.length - 1}
                  className="text-slate-300 hover:text-slate-500 disabled:opacity-20 text-xs leading-none">▼</button>
              </div>
            )}
          </div>

          {/* Inputs */}
          <div className="flex-1 space-y-1.5">
            <input
              className="input text-sm"
              placeholder={`Stop ${i + 1} address`}
              value={stop.addr}
              onChange={e => updateStop(i, 'addr', e.target.value)}
            />
            <div className="grid grid-cols-2 gap-1.5">
              <input
                className="input text-xs"
                placeholder="Latitude (optional)"
                value={stop.lat}
                onChange={e => updateStop(i, 'lat', e.target.value)}
              />
              <input
                className="input text-xs"
                placeholder="Longitude (optional)"
                value={stop.lng}
                onChange={e => updateStop(i, 'lng', e.target.value)}
              />
            </div>
          </div>

          {/* Remove */}
          <button onClick={() => removeStop(i)}
            className="mt-2 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0">
            <Trash2 size={15} />
          </button>
        </div>
      ))}

      <button onClick={addStop}
        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl py-2.5 text-sm font-medium transition-colors">
        <Plus size={15} /> Add Stop
      </button>

      {stops.length > 0 && (
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
          ₹20 per stop · {stops.length} stop{stops.length > 1 ? 's' : ''} = ₹{stops.length * 20} extra
        </p>
      )}
    </div>
  )
}
