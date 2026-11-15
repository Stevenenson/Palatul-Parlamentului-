import { Component, type ReactNode } from 'react'
import { useTour } from '../state/tour'

/**
 * Dacă scena 3D nu poate porni (WebGL oprit, placă video refuzată, eroare la încărcare),
 * pagina rămâne în picioare: textele, legenda și linkurile merg fără machetă.
 */
type Props = { children: ReactNode; onError?: () => void }

export class SceneBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    if (this.props.onError) this.props.onError()
    else useTour.getState().set({ scene: 'failed' })
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}
