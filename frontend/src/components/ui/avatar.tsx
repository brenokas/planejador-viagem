import { cn } from '@/lib/utils'

const cores = ['bg-teal-600', 'bg-rose-500', 'bg-amber-500', 'bg-indigo-500', 'bg-sky-600', 'bg-fuchsia-600']

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/)
  return ((partes[0]?.[0] ?? '') + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase()
}

export function Avatar({ id, nome, className }: { id: number; nome: string; className?: string }) {
  return (
    <span
      title={nome}
      className={cn(
        'inline-flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ring-2 ring-white',
        cores[id % cores.length],
        className,
      )}
    >
      {iniciais(nome)}
    </span>
  )
}

export function AvatarGroup({ pessoas }: { pessoas: { id: number; nome: string }[] }) {
  return (
    <div className="flex -space-x-2">
      {pessoas.map((p) => (
        <Avatar key={p.id} id={p.id} nome={p.nome} />
      ))}
    </div>
  )
}
