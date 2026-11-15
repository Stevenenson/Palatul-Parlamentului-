import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { live } from '../../state/tour'
import { buildPalace } from './buildPalace'

/** Macheta palatului. Devine transparentă când turul intră în săli sau ajunge la hartă. */
export function Palace() {
  const palace = useMemo(() => buildPalace(), [])

  useEffect(() => () => palace.dispose(), [palace])

  useEffect(() => {
    if (!live.debug) return
    const tour = (window as unknown as { __tour?: Record<string, unknown> }).__tour
    if (tour) tour.palace = palace.group
  }, [palace])

  const gl = useThree((state) => state.gl)

  // Planul de sit schematic (piața și axul bulevardului) lasă locul străzilor adevărate cât se vede orașul.
  const site = useMemo(() => palace.group.getObjectByName('sit'), [palace])

  useFrame(() => {
    if (palace.update(live.solid, live.map)) gl.shadowMap.needsUpdate = true
    if (site) site.visible = live.city < 0.5
  })

  return <primitive object={palace.group} />
}
