import { cn } from '@/lib/utils'

const cores = ['bg-[#b03a22]', 'bg-[#1e4b8f]', 'bg-[#8a5a12]', 'bg-[#2f5d5a]', 'bg-[#6b3b7a]', 'bg-[#4f6328]']

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/)
  return ((partes[0]?.[0] ?? '') + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase()
}

export function Avatar({ id, nome, className }: { id: number; nome: string; className?: string }) {
  return (
    <span
      title={nome}
      className={cn(
        'inline-flex size-8 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold text-white ring-2 ring-white',
        cores[id % cores.length],
        className,
      )}
    >
      {iniciais(nome)}
    </span>
  )
}

export function AvatarGroup({
  pessoas,
  online = [],
}: {
  pessoas: { id: number; nome: string }[]
  /** ids de quem está online agora (recebem um ponto verde) */
  online?: number[]
}) {
  return (
    <div className="flex -space-x-2">
      {pessoas.map((p) => (
        <span key={p.id} className="relative">
          <Avatar id={p.id} nome={p.nome} />
          {online.includes(p.id) && (
            <span className="absolute right-0 bottom-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white">
              <span className="sr-only">online agora</span>
            </span>
          )}
        </span>
      ))}
    </div>
  )
}
