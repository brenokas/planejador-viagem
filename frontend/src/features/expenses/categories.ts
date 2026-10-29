import { ArrowRightLeft, BedDouble, Bus, Camera, Circle, ShoppingBag, UtensilsCrossed, type LucideIcon } from 'lucide-react'
import type { ExpenseCategory } from './api'

export const CATEGORIAS_DESPESA: Record<ExpenseCategory, { label: string; icon: LucideIcon; barra: string; classe: string }> = {
  HOSPEDAGEM: { label: 'Hospedagem', icon: BedDouble, barra: 'bg-[#6b3b7a]', classe: 'bg-[#ebdfef] text-[#6b3b7a]' },
  TRANSPORTE: { label: 'Transporte', icon: Bus, barra: 'bg-[#a26b14]', classe: 'bg-[#f3e4c2] text-[#7a4f10]' },
  ALIMENTACAO: { label: 'Alimentação', icon: UtensilsCrossed, barra: 'bg-[#c2412b]', classe: 'bg-[#f6ddd3] text-[#a93a22]' },
  PASSEIOS: { label: 'Passeios', icon: Camera, barra: 'bg-[#1e4b8f]', classe: 'bg-[#dce5f2] text-[#1e4b8f]' },
  COMPRAS: { label: 'Compras', icon: ShoppingBag, barra: 'bg-[#4f6328]', classe: 'bg-[#e1e7d0] text-[#4f6328]' },
  OUTROS: { label: 'Outros', icon: Circle, barra: 'bg-slate-400', classe: 'bg-slate-100 text-slate-600' },
  ACERTO: { label: 'Acerto', icon: ArrowRightLeft, barra: 'bg-slate-300', classe: 'bg-slate-100 text-slate-500' },
}

/** Categorias que o usuário escolhe ao lançar uma despesa (acerto é criado pelo botão próprio). */
export const CATEGORIAS_LANCAVEIS = (Object.keys(CATEGORIAS_DESPESA) as ExpenseCategory[]).filter((c) => c !== 'ACERTO')
