import { useEffect, useMemo } from 'react'
import { ROOMS } from '../../content/rooms'
import { buildRoom } from './buildRoom'

/**
 * Cele patru săli, așezate în interiorul palatului. Stau montate tot timpul: sunt
 * câteva mesh-uri fiecare, iar de pe hartă și din zbor trebuie să se vadă toate.
 */
export function Rooms() {
  const rooms = useMemo(() => ROOMS.map(buildRoom), [])

  useEffect(() => () => rooms.forEach((room) => room.dispose()), [rooms])

  return (
    <>
      {rooms.map((room) => (
        <primitive key={room.group.name} object={room.group} />
      ))}
    </>
  )
}
