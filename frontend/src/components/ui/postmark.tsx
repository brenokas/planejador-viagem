import { useId } from 'react'
import { cn } from '@/lib/utils'

/**
 * Carimbo postal: dois círculos com um texto curvo no alto, três linhas no centro
 * e as ondas de obliteração à direita. Usa a cor do texto (currentColor).
 */
export function Postmark({
  topo,
  linhas,
  ondas = true,
  className,
}: {
  /** Texto curvo no alto do carimbo (ex.: o destino). */
  topo: string
  /** Até três linhas no centro; a do meio fica maior. */
  linhas: [string, string, string?]
  ondas?: boolean
  className?: string
}) {
  const id = useId()
  const [l1, l2, l3] = linhas
  return (
    <svg
      viewBox={ondas ? '0 0 220 100' : '0 0 100 100'}
      className={cn('pointer-events-none select-none', className)}
      aria-hidden
      fill="none"
      stroke="currentColor"
    >
      <defs>
        <path id={id} d="M 50,50 m -37,0 a 37,37 0 1,1 74,0" />
      </defs>
      <circle cx="50" cy="50" r="46" strokeWidth="2.5" />
      <circle cx="50" cy="50" r="29" strokeWidth="1.5" />
      <text fill="currentColor" stroke="none" fontFamily="var(--font-mono)" fontWeight="700" fontSize="9.5" letterSpacing="1.5">
        <textPath href={`#${id}`} startOffset="50%" textAnchor="middle">
          {topo.toUpperCase().slice(0, 22)}
        </textPath>
      </text>
      <g fill="currentColor" stroke="none" fontFamily="var(--font-mono)" fontWeight="700" textAnchor="middle">
        <text x="50" y="40" fontSize="8" letterSpacing="1">
          {l1.toUpperCase()}
        </text>
        <text x="50" y="56" fontSize="13">
          {l2.toUpperCase()}
        </text>
        {l3 && (
          <text x="50" y="70" fontSize="8" letterSpacing="1">
            {l3.toUpperCase()}
          </text>
        )}
      </g>
      {ondas && (
        <g strokeWidth="2.5" strokeLinecap="round">
          {[28, 42, 56, 70].map((y) => (
            <path key={y} d={`M104 ${y} q 9 -7 18 0 t 18 0 t 18 0 t 18 0 t 18 0 t 18 0`} />
          ))}
        </g>
      )}
    </svg>
  )
}
