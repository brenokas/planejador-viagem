import { useNavigate } from 'react-router'
import { Avatar } from '@/components/ui/avatar'
import { Dialog } from '@/components/ui/dialog'
import { useMe } from '@/features/auth/api'
import { useRemoveMember, type Trip } from './api'

export function MembersDialog({
  trip,
  open,
  onClose,
  onInvite,
}: {
  trip: Trip
  open: boolean
  onClose: () => void
  onInvite: () => void
}) {
  const { data: me } = useMe()
  const remove = useRemoveMember(trip.id)
  const navigate = useNavigate()
  const souDono = trip.meuPapel === 'DONO'

  const handleRemove = (userId: number, nome: string) => {
    const saindo = userId === me?.id
    const pergunta = saindo ? 'Sair desta viagem? Você perderá o acesso a ela.' : `Remover ${nome} da viagem?`
    if (!window.confirm(pergunta)) return
    remove.mutate(userId, {
      onSuccess: () => {
        if (saindo) navigate('/', { replace: true })
      },
    })
  }

  return (
    <Dialog open={open} onClose={onClose} title="Participantes">
      <ul className="divide-y divide-slate-100">
        {trip.membros.map((m) => {
          const souEu = m.id === me?.id
          const podeRemover = (souDono && !souEu) || (souEu && m.papel !== 'DONO')
          return (
            <li key={m.id} className="flex items-center gap-3 py-3">
              <Avatar id={m.id} nome={m.nome} className="size-10 ring-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {m.nome} {souEu && <span className="text-slate-400">(você)</span>}
                </p>
                <p className="text-xs text-slate-500">{m.papel === 'DONO' ? 'Criou a viagem' : 'Pode editar'}</p>
              </div>
              {podeRemover && (
                <button
                  onClick={() => handleRemove(m.id, m.nome)}
                  disabled={remove.isPending}
                  className="rounded-lg px-2 py-1 text-sm text-red-600 hover:bg-red-50"
                >
                  {souEu ? 'Sair' : 'Remover'}
                </button>
              )}
            </li>
          )
        })}
      </ul>
      {remove.error && <p className="mt-2 text-sm text-red-600">{remove.error.message}</p>}
      <button
        onClick={() => {
          onClose()
          onInvite()
        }}
        className="mt-4 w-full rounded-lg border border-dashed border-slate-300 py-3 text-sm font-medium text-primary hover:bg-slate-50"
      >
        + Convidar alguém
      </button>
    </Dialog>
  )
}
