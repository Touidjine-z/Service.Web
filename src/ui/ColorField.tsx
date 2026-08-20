import { useEffect, useState } from 'react'
import { hexToHsl, hexToRgb, hslToHex, isValidHex, normalizeHex, rgbToHex } from '@/engine/color'

type Format = 'hex' | 'rgb' | 'hsl'

/** Selecteur complet HEX / RGB / HSL (§11). */
export default function ColorField({
  label, value, onChange,
}: { label: string; value: string; onChange: (hex: string) => void }) {
  const [format, setFormat] = useState<Format>('hex')
  const [text, setText] = useState(value)

  // Resynchronise le champ quand la couleur change ailleurs (palette generee, undo).
  useEffect(() => { setText(formatValue(value, format)) }, [value, format])

  function commit(raw: string) {
    setText(raw)
    const parsed = parseValue(raw, format)
    if (parsed) onChange(parsed)
  }

  return (
    <div className="flex items-center gap-3">
      <label className="relative h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-xl ring-1 ring-line">
        <span className="block h-full w-full" style={{ background: value }} />
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(normalizeHex(e.target.value))}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label={`Couleur ${label}`}
        />
      </label>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-ink">{label}</span>
          <div className="flex gap-0.5">
            {(['hex', 'rgb', 'hsl'] as Format[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                className={[
                  'rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase transition',
                  format === f ? 'bg-brand/10 text-brand' : 'text-subtle hover:text-muted',
                ].join(' ')}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <input
          className="field !py-1.5 font-mono text-xs"
          value={text}
          onChange={(e) => commit(e.target.value)}
          onBlur={() => setText(formatValue(value, format))}
          spellCheck={false}
        />
      </div>
    </div>
  )
}

function formatValue(hex: string, format: Format): string {
  if (format === 'hex') return hex
  if (format === 'rgb') {
    const { r, g, b } = hexToRgb(hex)
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`
  }
  const { h, s, l } = hexToHsl(hex)
  return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`
}

function parseValue(raw: string, format: Format): string | null {
  const value = raw.trim()
  if (format === 'hex') return isValidHex(value) ? normalizeHex(value) : null

  const numbers = value.match(/-?\d+(\.\d+)?/g)?.map(Number)
  if (!numbers || numbers.length < 3) return null

  if (format === 'rgb') {
    const [r, g, b] = numbers
    if ([r, g, b].some((n) => n < 0 || n > 255)) return null
    return rgbToHex({ r, g, b })
  }

  const [h, s, l] = numbers
  if (s < 0 || s > 100 || l < 0 || l > 100) return null
  return hslToHex({ h, s, l })
}
