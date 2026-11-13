import { BackSide } from 'three'
import { ROOMS } from '../content/rooms'

/**
 * Volume provizorii pentru săli, până la Pasul 2: arată unde stă fiecare sală în palat
 * și verifică traseul camerei.
 */
export function RoomsPlaceholder() {
  return (
    <group>
      {ROOMS.map((room) => {
        const [w, h, d] = room.size
        const [x, y, z] = room.floor
        const [hx, hy, hz] = room.hologram.at
        return (
          <group key={room.id} position={[x, y, z]}>
            <mesh position={[0, h / 2, 0]}>
              <boxGeometry args={[w, h, d]} />
              <meshStandardMaterial color="#f7f5f1" roughness={0.95} side={BackSide} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
              <planeGeometry args={[w * 0.6, d * 0.6]} />
              <meshStandardMaterial color={room.accent} roughness={0.9} />
            </mesh>
            <mesh position={[hx, hy + 2, hz]}>
              <boxGeometry args={[1.2, 2.4, 1.2]} />
              <meshStandardMaterial color={room.accent} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}
