import type { ChecklistType } from './api'

/** Ponto de partida quando a lista está vazia. A IA (fase 6) vai sugerir itens específicos do destino. */
export const SUGESTOES: Record<ChecklistType, string[]> = {
  BAGAGEM: [
    'Documentos (RG ou passaporte)',
    'Carregadores de celular',
    'Adaptador de tomada',
    'Remédios de uso contínuo',
    'Escova e pasta de dente',
    'Desodorante',
    'Roupas íntimas',
    'Pijama',
    'Calçado confortável para caminhar',
    'Casaco leve',
    'Óculos de sol',
    'Protetor solar',
    'Garrafa de água',
    'Fone de ouvido',
  ],
  TAREFA: [
    'Conferir validade dos documentos',
    'Contratar seguro viagem',
    'Confirmar reservas de hospedagem',
    'Fazer check-in online',
    'Avisar o banco sobre a viagem',
    'Separar dinheiro ou cartão para a moeda local',
    'Baixar mapas offline do destino',
    'Combinar quem cuida da casa e das plantas',
  ],
}
