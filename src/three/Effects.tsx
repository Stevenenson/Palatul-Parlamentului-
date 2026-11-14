import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { EffectComposer, N8AO } from '@react-three/postprocessing'
import { MathUtils } from 'three'
import { live } from '../state/tour'

/**
 * Ocluzie ambientală: întunecă ușor colțurile și golurile, ca la o machetă fotografiată.
 * Raza e în metri: mare pe exterior, unde contează cornișele, și mică în săli, unde
 * altfel pereții apropiați ar înnegri tot interiorul.
 *
 * Stă într-un fișier separat ca biblioteca de postprocesare să se încarce doar pe
 * calculatoare; pe telefoane scena rulează fără ea.
 */
export default function Effects() {
  const ao = useRef<{ configuration: { aoRadius: number; intensity: number } }>(null)

  useFrame(() => {
    const config = ao.current?.configuration
    if (!config) return
    config.aoRadius = MathUtils.lerp(2.2, 6.5, live.solid)
    config.intensity = MathUtils.lerp(1.6, 2.1, live.solid)
  })

  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <N8AO ref={ao} aoRadius={6.5} distanceFalloff={1} intensity={2.1} quality="medium" color="#3b362d" />
    </EffectComposer>
  )
}
