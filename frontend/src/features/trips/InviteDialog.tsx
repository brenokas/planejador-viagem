import { Check, Copy, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { buttonClass } from '@/components/ui/button-class'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { copyText } from '@/lib/clipboard'
import { useCreateInvite, type Trip } from './api'

export function InviteDialog({ trip, open, onClose }: { trip: Trip; open: boolean; onClose: () => void }) {
  const invite = useCreateInvite(trip.id)
  const [copiado, setCopiado] = useState(false)

  const link = invite.data ? `${window.location.origin}/convite/${invite.data.token}` : ''
  const mensagem = `Vamos planejar juntos a viagem "${trip.titulo}"? Entre por aqui: ${link}`

  const handleClose = () => {
    invite.reset()
    setCopiado(false)
    onClose()
  }

  const handleCopy = async () => {
    if (await copyText(link)) {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} title="Convidar para a viagem">
      {!invite.data ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Gere um link de convite e envie para quem vai viajar com você. A pessoa precisa estar no mesmo Wi-Fi,
            criar uma conta (ou entrar) e aceitar o convite. O link vale por 7 dias e pode ser usado uma vez.
          </p>
          {invite.error && <p className="text-sm text-red-600">{invite.error.message}</p>}
          <Button className="w-full" onClick={() => invite.mutate()} disabled={invite.isPending}>
            {invite.isPending ? 'Gerando…' : 'Gerar link de convite'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <Input readOnly value={link} onFocus={(e) => e.currentTarget.select()} className="text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={handleCopy}>
              {copiado ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
              {copiado ? 'Copiado!' : 'Copiar'}
            </Button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(mensagem)}`}
              target="_blank"
              rel="noreferrer"
              className={buttonClass('primary', 'bg-[#25D366] hover:bg-[#1ebe5b]')}
            >
              <MessageCircle className="size-4" />
              WhatsApp
            </a>
          </div>
        </div>
      )}
    </Dialog>
  )
}
