import { BedDouble, Bus, Camera, Circle, ShoppingBag, UtensilsCrossed, type LucideIcon } from 'lucide-react'
import type { Category } from './api'

export const CATEGORIAS: Record<Category, { label: string; icon: LucideIcon; cor: string; classe: string }> = {
  PASSEIO: { label: 'Passeio', icon: Camera, cor: '#0d9488', classe: 'bg-teal-100 text-teal-700' },
  REFEICAO: { label: 'Refeição', icon: UtensilsCrossed, cor: '#f97316', classe: 'bg-orange-100 text-orange-700' },
  TRANSPORTE: { label: 'Transporte', icon: Bus, cor: '#6366f1', classe: 'bg-indigo-100 text-indigo-700' },
  HOSPEDAGEM: { label: 'Hospedagem', icon: BedDouble, cor: '#a855f7', classe: 'bg-purple-100 text-purple-700' },
  COMPRAS: { label: 'Compras', icon: ShoppingBag, cor: '#e11d48', classe: 'bg-rose-100 text-rose-700' },
  OUTRO: { label: 'Outro', icon: Circle, cor: '#64748b', classe: 'bg-slate-100 text-slate-600' },
}

export const CATEGORIA_ORDEM = Object.keys(CATEGORIAS) as Category[]
