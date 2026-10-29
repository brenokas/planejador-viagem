import { afterEach, describe, expect, it, vi } from 'vitest'
import { centsToInput, formatDateRange, parseDecimal, parseMoney, tripDays, tripStatus } from './format'

describe('parseMoney', () => {
  it('aceita formato brasileiro e com ponto decimal', () => {
    expect(parseMoney('1.234,56')).toBe(123456)
    expect(parseMoney('1234.56')).toBe(123456)
    expect(parseMoney('R$ 10')).toBe(1000)
    expect(parseMoney('0,1')).toBe(10)
  })

  it('distingue vazio de inválido', () => {
    expect(parseMoney('')).toBeNull()
    expect(parseMoney('   ')).toBeNull()
    expect(parseMoney('abc,1,2')).toBeNaN()
  })

  it('evita erro de ponto flutuante', () => {
    expect(parseMoney('0,29')).toBe(29)
    expect(parseMoney('19,99')).toBe(1999)
  })
})

describe('parseDecimal', () => {
  it('lê taxas de câmbio com várias casas', () => {
    expect(parseDecimal('5,959207')).toBeCloseTo(5.959207)
    expect(parseDecimal('6.1')).toBeCloseTo(6.1)
  })
})

describe('centsToInput', () => {
  it('formata para edição em pt-BR', () => {
    expect(centsToInput(123456)).toBe('1.234,56')
    expect(centsToInput(null)).toBe('')
  })
})

describe('datas da viagem', () => {
  afterEach(() => vi.useRealTimers())

  it('conta os dias incluindo ida e volta, sem problemas de fuso', () => {
    expect(tripDays('2027-03-01', '2027-03-01')).toBe(1)
    expect(tripDays('2027-02-27', '2027-03-02')).toBe(4)
    // Virada do horário de verão em outros fusos não pode alterar a contagem.
    expect(tripDays('2027-10-30', '2027-11-02')).toBe(4)
  })

  it('resume o período sem repetir mês e ano', () => {
    expect(formatDateRange('2027-05-10', '2027-05-17')).toBe('10 – 17 de mai. de 2027')
    expect(formatDateRange('2027-12-28', '2028-01-03')).toContain('2028')
  })

  it('calcula o status em relação a hoje', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2027, 4, 12, 15, 0))
    expect(tripStatus('2027-05-13', '2027-05-20')).toEqual({ tipo: 'futura', faltam: 1 })
    expect(tripStatus('2027-05-10', '2027-05-14')).toEqual({ tipo: 'andamento', dia: 3, total: 5 })
    expect(tripStatus('2027-05-01', '2027-05-11')).toEqual({ tipo: 'concluida' })
  })
})
