import type { MouseEvent } from 'react'
import { goToStopId } from '../scroll/director'

/**
 * Proprietăți pentru un link către o oprire a turului. `href` rămâne o ancoră
 * obișnuită, deci linkul merge și cu deschidere în filă nouă sau fără JavaScript.
 * La click, turul zboară la oprire, adresa primește ancora, iar focusul trece pe
 * titlul secțiunii, ca următorul Tab să continue de acolo.
 */
export function stopLink(id: string) {
  return {
    href: `#${id}`,
    onClick: (event: MouseEvent<HTMLAnchorElement>) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
      event.preventDefault()
      goToStopId(id, { push: true, focus: true })
    },
  }
}
