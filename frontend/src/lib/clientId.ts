/** Identifica esta aba, para ignorar eventos de tempo real causados por ela mesma. */
export const CLIENT_ID = Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, '0')).join('')
