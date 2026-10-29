import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useMemo } from 'react'
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import type { Activity } from './api'
import { formatTime, mapNumbers } from './days'

export type MapGroup = { chave: string; titulo: string; cor: string; atividades: Activity[]; ligar: boolean }

function icone(numero: number, cor: string) {
  return L.divIcon({
    className: '',
    html: `<div style="background:${cor}" class="flex size-7 items-center justify-center rounded-full border-2 border-white font-mono text-xs font-bold text-white shadow-md">${numero}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  })
}

function FitBounds({ pontos }: { pontos: [number, number][] }) {
  const map = useMap()
  const chave = pontos.map((p) => p.join(',')).join('|')
  useEffect(() => {
    if (!chave) return
    const lista = chave.split('|').map((p) => p.split(',').map(Number) as [number, number])
    const enquadrar = () => map.fitBounds(L.latLngBounds(lista), { padding: [40, 40], maxZoom: 15 })
    enquadrar()
    // No celular o mapa nasce escondido (aba Lista) com tamanho zero; ao aparecer, recalcula e reenquadra.
    let largura = map.getContainer().clientWidth
    const observer = new ResizeObserver(() => {
      const nova = map.getContainer().clientWidth
      map.invalidateSize()
      if (largura === 0 && nova > 0) enquadrar()
      largura = nova
    })
    observer.observe(map.getContainer())
    return () => observer.disconnect()
  }, [map, chave])
  return null
}

export default function ItineraryMap({ grupos }: { grupos: MapGroup[] }) {
  const itens = useMemo(
    () =>
      grupos.flatMap((g) => {
        const numeros = mapNumbers(g.atividades)
        return g.atividades
          .filter((a) => a.lat != null && a.lng != null)
          .map((a) => ({ a, g, numero: numeros.get(a.id)!, pos: [a.lat!, a.lng!] as [number, number] }))
      }),
    [grupos],
  )

  return (
    <MapContainer center={[0, 0]} zoom={2} scrollWheelZoom className="size-full" attributionControl>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds pontos={itens.map((i) => i.pos)} />
      {grupos
        .filter((g) => g.ligar)
        .map((g) => {
          const linha = itens.filter((i) => i.g.chave === g.chave).map((i) => i.pos)
          return linha.length > 1 ? (
            <Polyline key={g.chave} positions={linha} pathOptions={{ color: g.cor, weight: 3, opacity: 0.7, dashArray: '6 6' }} />
          ) : null
        })}
      {itens.map(({ a, g, numero, pos }) => (
        <Marker key={a.id} position={pos} icon={icone(numero, g.cor)}>
          <Popup>
            <div className="space-y-1">
              <p className="text-xs text-slate-500">{g.titulo}</p>
              <p className="font-semibold">
                {formatTime(a.horaInicio) && <span className="mr-1">{formatTime(a.horaInicio)} ·</span>}
                {a.titulo}
              </p>
              {a.localNome && <p className="text-slate-600">{a.localNome}</p>}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${a.lat},${a.lng}`}
                target="_blank"
                rel="noreferrer"
              >
                Como chegar →
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
