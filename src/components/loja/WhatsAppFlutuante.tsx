'use client'

import { usePathname } from 'next/navigation'

/** Botão flutuante de WhatsApp (escondido no carrinho e no checkout). */
export default function WhatsAppFlutuante({ href }: { href: string }) {
  const path = usePathname()
  if (path.startsWith('/carrinho') || path.startsWith('/checkout')) return null

  const mensagem = encodeURIComponent('Olá! Vim pelo site da VERSAR e tenho uma dúvida.')

  return (
    <a
      href={`${href}?text=${mensagem}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
    >
      <svg viewBox="0 0 32 32" className="w-7 h-7" fill="currentColor" aria-hidden="true">
        <path d="M16.04 3C9.42 3 4.05 8.37 4.05 14.99c0 2.11.55 4.17 1.6 5.99L4 29l8.23-2.16a11.93 11.93 0 0 0 3.81.62h.01c6.61 0 11.99-5.37 11.99-11.99C28.04 8.37 22.66 3 16.04 3zm0 21.94h-.01c-1.2 0-2.38-.24-3.48-.71l-.25-.11-4.88 1.28 1.3-4.75-.16-.26a9.9 9.9 0 0 1-1.52-5.29c0-5.49 4.47-9.96 9.97-9.96 2.66 0 5.16 1.04 7.04 2.92a9.9 9.9 0 0 1 2.92 7.05c0 5.49-4.47 9.96-9.93 9.96zm5.46-7.46c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35z" />
      </svg>
    </a>
  )
}
