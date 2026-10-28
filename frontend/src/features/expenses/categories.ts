import { ArrowRightLeft, BedDouble, Bus, Camera, Circle, ShoppingBag, UtensilsCrossed, type LucideIcon } from 'lucide-react'
import type { ExpenseCategory } from './api'

export const CATEGORIAS_DESPESA: Record<ExpenseCategory, { label: string; icon: LucideIcon; barra: string; classe: string }> = {
  HOSPEDAGEM: { label: 'Hospedagem', icon: BedDouble, barra: 'bg-purple-500', classe: 'bg-purple-100 text-purple-700' },
  TRANSPORTE: { label: 'Transporte', icon: Bus, barra: 'bg-indigo-500', classe: 'bg-indigo-100 text-indigo-700' },
  ALIMENTACAO: { label: 'Alimentação', icon: UtensilsCrossed, barra: 'bg-orange-500', classe: 'bg-orange-100 text-orange-700' },
  PASSEIOS: { label: 'Passeios', icon: Camera, barra: 'bg-teal-600', classe: 'bg-teal-100 text-teal-700' },
  COMPRAS: { label: 'Compras', icon: ShoppingBag, barra: 'bg-rose-500', classe: 'bg-rose-100 text-rose-700' },
  OUTROS: { label: 'Outros', icon: Circle, barra: 'bg-slate-400', classe: 'bg-slate-100 text-slate-600' },
  ACERTO: { label: 'Acerto', icon: ArrowRightLeft, barra: 'bg-slate-300', classe: 'bg-slate-100 text-slate-500' },
}

/** Categorias que o usuário escolhe ao lançar uma despesa (acerto é criado pelo botão próprio). */
export const CATEGORIAS_LANCAVEIS = (Object.keys(CATEGORIAS_DESPESA) as ExpenseCategory[]).filter((c) => c !== 'ACERTO')
