/**
 * Copia texto para a área de transferência. Em HTTP (fora de localhost) a Clipboard API
 * não está disponível, então usa o método antigo com um textarea temporário.
 */
export async function copyText(texto: string): Promise<boolean> {
  if (window.isSecureContext && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(texto)
      return true
    } catch {
      // continua para o método alternativo
    }
  }

  const textarea = document.createElement('textarea')
  textarea.value = texto
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  textarea.setSelectionRange(0, texto.length)
  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    document.body.removeChild(textarea)
  }
}
