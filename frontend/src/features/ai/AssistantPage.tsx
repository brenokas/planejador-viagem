import { ArrowLeft, SendHorizontal } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Link, useParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { useMe } from '@/features/auth/api'
import { useTrip } from '@/features/trips/api'
import { cn } from '@/lib/utils'
import { useChatHistory, useClearChat, useSendMessage, type ChatMessage } from './api'

const PERGUNTAS = [
  'O que não podemos deixar de ver?',
  'Precisamos de visto ou de algum documento especial?',
  'Como costuma ser o clima nessa época?',
  'Qual o melhor jeito de se locomover por lá?',
  'Nosso orçamento parece realista?',
]

export function AssistantPage() {
  const tripId = Number(useParams().id)
  const trip = useTrip(tripId)
  const historico = useChatHistory(tripId)
  const enviar = useSendMessage(tripId)
  const limpar = useClearChat(tripId)
  const { data: me } = useMe()
  const [texto, setTexto] = useState('')
  const fimRef = useRef<HTMLDivElement>(null)

  const mensagens = historico.data ?? []
  const pendente = enviar.isPending ? enviar.variables : null

  useEffect(() => {
    fimRef.current?.scrollIntoView({ block: 'end' })
  }, [mensagens.length, pendente])

  const mandar = (mensagem: string) => {
    const m = mensagem.trim()
    if (!m || enviar.isPending) return
    enviar.mutate(m, { onSuccess: () => setTexto('') })
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    mandar(texto)
  }

  // Enter envia; Shift+Enter quebra linha.
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      mandar(texto)
    }
  }

  const erro = trip.error ?? historico.error
  if (erro) return <p className="text-red-600">{erro.message}</p>
  if (!trip.data || !historico.data) return <p className="text-slate-500">Carregando…</p>

  return (
    <div className="mx-auto flex max-w-2xl flex-col">
      <div className="mb-4 flex items-center gap-3">
        <Link
          to={`/viagens/${tripId}`}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          aria-label="Voltar para a viagem"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold">Assistente</h1>
          <p className="truncate text-sm text-slate-500">Pergunte sobre {trip.data.destino}</p>
        </div>
        {mensagens.length > 0 && (
          <Button
            variant="ghost"
            className="h-9 px-3 text-slate-500"
            disabled={limpar.isPending}
            onClick={() => window.confirm('Apagar a conversa para os dois?') && limpar.mutate()}
          >
            Limpar
          </Button>
        )}
      </div>

      <div className="flex-1 space-y-3 pb-4" aria-live="polite">
        {mensagens.length === 0 && !pendente && (
          <div className="rounded-xl bg-white p-5 ring-1 ring-slate-200">
            <p className="text-sm text-slate-600">
              O assistente conhece o roteiro, o orçamento e o checklist desta viagem. A conversa fica salva e os dois
              veem as mesmas mensagens.
            </p>
            <div className="mt-4 flex flex-col items-start gap-2">
              {PERGUNTAS.map((p) => (
                <button
                  key={p}
                  onClick={() => mandar(p)}
                  className="rounded-full bg-slate-100 px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-200"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {mensagens.map((m) => (
          <Bolha key={m.id} mensagem={m} minha={m.role === 'user' && m.autorId === me?.id} />
        ))}

        {pendente && (
          <>
            <Bolha mensagem={{ id: -1, role: 'user', autorId: me?.id ?? null, autorNome: me?.nome ?? null, conteudo: pendente, criadoEm: '' }} minha />
            <div className="w-fit rounded-2xl rounded-bl-md bg-white px-4 py-3 text-sm text-slate-500 ring-1 ring-slate-200">
              Pensando…
            </div>
          </>
        )}
        {enviar.error && <p className="text-sm text-red-600">{enviar.error.message}</p>}
        <div ref={fimRef} />
      </div>

      <form
        onSubmit={submit}
        className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] flex items-end gap-2 rounded-xl bg-white p-2 shadow-sm ring-1 ring-slate-200 md:bottom-4"
      >
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          maxLength={1000}
          placeholder="Escreva uma pergunta"
          aria-label="Pergunta para o assistente"
          className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-base focus:outline-none"
        />
        <Button type="submit" className="size-10 shrink-0 px-0" disabled={!texto.trim() || enviar.isPending} aria-label="Enviar">
          <SendHorizontal className="size-5" />
        </Button>
      </form>
    </div>
  )
}

function Bolha({ mensagem: m, minha }: { mensagem: ChatMessage; minha: boolean }) {
  if (m.role === 'assistant') {
    return (
      <div className="max-w-[90%] rounded-2xl rounded-bl-md bg-white px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap ring-1 ring-slate-200">
        {m.conteudo}
      </div>
    )
  }
  return (
    <div className={cn('flex flex-col', minha ? 'items-end' : 'items-start')}>
      {!minha && m.autorNome && <span className="mb-0.5 px-1 text-xs text-slate-500">{m.autorNome.split(' ')[0]}</span>}
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-2.5 text-[15px] whitespace-pre-wrap',
          minha ? 'rounded-br-md bg-primary text-white' : 'rounded-bl-md bg-slate-200 text-slate-900',
        )}
      >
        {m.conteudo}
      </div>
    </div>
  )
}
