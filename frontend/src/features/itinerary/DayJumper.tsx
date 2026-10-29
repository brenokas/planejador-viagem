import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

export type JumpTarget = { id: string; label: string; sublabel?: string; preenchido: boolean }

/**
 * Faixa fixa com os dias da viagem: toque para pular até o dia; destaca o dia que está na tela.
 * Evita rolar uma lista longa procurando o "Dia 5".
 */
export function DayJumper({ alvos }: { alvos: JumpTarget[] }) {
  const [ativo, setAtivo] = useState(alvos[0]?.id)
  const faixa = useRef<HTMLDivElement>(null)
  const chave = alvos.map((a) => a.id).join()

  useEffect(() => {
    const secoes = chave
      .split(',')
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el != null)
    const observer = new IntersectionObserver(
      (entradas) => {
        const visivel = entradas.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (visivel) setAtivo(visivel.target.id)
      },
      { rootMargin: '-140px 0px -55% 0px' },
    )
    secoes.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [chave])

  // Mantém o chip ativo visível na faixa, sem mexer na rolagem da página.
  useEffect(() => {
    const el = faixa.current?.querySelector<HTMLElement>(`[data-alvo="${ativo}"]`)
    if (el && faixa.current) {
      faixa.current.scrollTo({ left: el.offsetLeft - faixa.current.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' })
    }
  }, [ativo])

  const pular = (id: string) => {
    setAtivo(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-20 -mx-4 mb-4 border-b border-slate-200 bg-slate-50 md:top-[6.5rem] lg:mx-0 lg:border-none">
      <div ref={faixa} className="flex gap-1.5 overflow-x-auto px-4 py-2 [scrollbar-width:none] lg:px-0">
        {alvos.map((a) => (
          <button
            key={a.id}
            data-alvo={a.id}
            onClick={() => pular(a.id)}
            aria-current={ativo === a.id ? 'location' : undefined}
            className={cn(
              'relative flex shrink-0 flex-col items-center rounded-lg px-3 py-1 font-mono text-xs leading-tight ring-1',
              ativo === a.id
                ? 'bg-slate-900 text-white ring-slate-900'
                : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-100',
            )}
          >
            <span className="font-semibold">{a.label}</span>
            {a.sublabel && <span className={cn('tabular-nums', ativo === a.id ? 'text-white/70' : 'text-slate-500')}>{a.sublabel}</span>}
            {a.preenchido && (
              <span
                className={cn(
                  'absolute top-1 right-1 size-1.5 rounded-full',
                  ativo === a.id ? 'bg-white' : 'bg-tomato',
                )}
                aria-label="tem atividades"
              />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
