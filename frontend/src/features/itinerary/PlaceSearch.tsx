import { Loader2, MapPin, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { useGeoSearch, type GeoPlace } from './api'

export type PlaceValue = { localNome: string; lat: number | null; lng: number | null }

/**
 * Campo de local: texto livre com sugestões do OpenStreetMap. Escolher uma sugestão define as coordenadas
 * (necessárias para o mapa); editar o texto manualmente remove as coordenadas.
 */
export function PlaceSearch({
  id,
  value,
  destino,
  onChange,
}: {
  id: string
  value: PlaceValue
  destino: string
  onChange: (v: PlaceValue) => void
}) {
  const [termo, setTermo] = useState('')
  const [aberto, setAberto] = useState(false)
  const debounced = useDebounced(termo, 600)
  const busca = useGeoSearch(aberto ? debounced : '', destino)
  const temCoordenadas = value.lat != null && value.lng != null

  const escolher = (p: GeoPlace) => {
    onChange({ localNome: p.nome, lat: p.lat, lng: p.lng })
    setAberto(false)
    setTermo('')
  }

  return (
    <div className="relative">
      <div className="relative">
        <Input
          id={id}
          value={value.localNome}
          placeholder="Ex.: Coliseu"
          autoComplete="off"
          className="pr-9"
          onChange={(e) => {
            onChange({ localNome: e.target.value, lat: null, lng: null })
            setTermo(e.target.value)
            setAberto(true)
          }}
          onBlur={() => setTimeout(() => setAberto(false), 200)}
        />
        {value.localNome && (
          <button
            type="button"
            aria-label="Limpar local"
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600"
            onClick={() => onChange({ localNome: '', lat: null, lng: null })}
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
        <MapPin className="size-3.5" />
        {temCoordenadas ? 'Local marcado no mapa' : 'Escolha uma sugestão para aparecer no mapa'}
      </p>

      {aberto && debounced.trim().length >= 3 && (
        <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-lg bg-white py-1 shadow-lg ring-1 ring-slate-200">
          {busca.isFetching ? (
            <li className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500">
              <Loader2 className="size-4 animate-spin" /> Buscando…
            </li>
          ) : busca.error ? (
            <li className="px-3 py-2 text-sm text-red-600">{busca.error.message}</li>
          ) : busca.data?.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-500">Nenhum local encontrado.</li>
          ) : (
            busca.data?.map((p) => (
              <li key={`${p.lat},${p.lng}`}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => escolher(p)}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50"
                >
                  <p className="text-sm font-medium">{p.nome}</p>
                  <p className="truncate text-xs text-slate-500">{p.endereco}</p>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}
