import { BedDouble, Bus, Camera, Circle, ShoppingBag, UtensilsCrossed, type LucideIcon } from 'lucide-react'
import type { Category } from './api'

export const CATEGORIAS: Record<Category, { label: string; icon: LucideIcon; cor: string; classe: string }> = {
  PASSEIO: { label: 'Passeio', icon: Camera, cor: '#1e4b8f', classe: 'bg-[#dce5f2] text-[#1e4b8f]' },
  REFEICAO: { label: 'Refeição', icon: UtensilsCrossed, cor: '#c2412b', classe: 'bg-[#f6ddd3] text-[#a93a22]' },
  TRANSPORTE: { label: 'Transporte', icon: Bus, cor: '#a26b14', classe: 'bg-[#f3e4c2] text-[#7a4f10]' },
  HOSPEDAGEM: { label: 'Hospedagem', icon: BedDouble, cor: '#6b3b7a', classe: 'bg-[#ebdfef] text-[#6b3b7a]' },
  COMPRAS: { label: 'Compras', icon: ShoppingBag, cor: '#4f6328', classe: 'bg-[#e1e7d0] text-[#4f6328]' },
  OUTRO: { label: 'Outro', icon: Circle, cor: '#6e604c', classe: 'bg-slate-100 text-slate-600' },
}

export const CATEGORIA_ORDEM = Object.keys(CATEGORIAS) as Category[]
