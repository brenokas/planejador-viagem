import { describe, expect, it } from 'vitest'
import type { Activity } from './api'
import { groupByDay, mapNumbers, tripDates } from './days'

function atividade(id: number, data: string | null, ordem: number, comLocal = false): Activity {
  return {
    id,
    titulo: `A${id}`,
    data,
    horaInicio: null,
    horaFim: null,
    categoria: 'PASSEIO',
    localNome: null,
    lat: comLocal ? 1 : null,
    lng: comLocal ? 1 : null,
    custoCentavos: null,
    notas: null,
    ordem,
    atualizadoPorNome: null,
    atualizadoEm: '',
    version: 0,
  }
}

describe('tripDates', () => {
  it('gera todas as datas, atravessando meses', () => {
    expect(tripDates('2027-01-30', '2027-02-02')).toEqual(['2027-01-30', '2027-01-31', '2027-02-01', '2027-02-02'])
  })
})

describe('groupByDay', () => {
  it('separa dias, ideias e atividades fora do período, respeitando a ordem', () => {
    const datas = tripDates('2027-03-01', '2027-03-02')
    const { dias, ideias, foraDasDatas } = groupByDay(
      [atividade(1, '2027-03-01', 1), atividade(2, '2027-03-01', 0), atividade(3, null, 0), atividade(4, '2027-04-01', 0)],
      datas,
    )
    expect(dias.map((d) => d.numero)).toEqual([1, 2])
    expect(dias[0].atividades.map((a) => a.id)).toEqual([2, 1])
    expect(dias[1].atividades).toEqual([])
    expect(ideias.atividades.map((a) => a.id)).toEqual([3])
    expect(foraDasDatas.map((a) => a.id)).toEqual([4])
  })
})

describe('mapNumbers', () => {
  it('numera só as atividades com local no mapa', () => {
    const numeros = mapNumbers([atividade(1, null, 0, true), atividade(2, null, 1), atividade(3, null, 2, true)])
    expect(Object.fromEntries(numeros)).toEqual({ 1: 1, 3: 2 })
  })
})
