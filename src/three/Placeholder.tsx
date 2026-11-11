import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { BackSide, MeshStandardMaterial } from 'three'
import { ROOMS } from '../content/rooms'
import { live } from '../state/tour'

const BLOCKS: { size: [number, number, number]; y: number }[] = [
  { size: [270, 44, 240], y: 22 },
  { size: [150, 22, 150], y: 55 },
  { size: [70, 18, 80], y: 75 },
]

/**
 * Volume provizorii pentru Pasul 0: verifică traseul camerei și trecerea carcasei
 * în transparență. La Pasul 1 și 2 le iau locul palatul și sălile adevărate.
 */
export function PalacePlaceholder() {
  const shell = useMemo(
    () => new MeshStandardMaterial({ color: '#f4f2ee', roughness: 0.9, transparent: true }),
    [],
  )

  useFrame(() => {
    shell.opacity = 0.08 + 0.92 * live.solid
    shell.depthWrite = live.solid > 0.5
  })

  return (
    <group>
      {BLOCKS.map((block, i) => (
        <mesh key={i} position={[0, block.y, 0]} material={shell} castShadow receiveShadow>
          <boxGeometry args={block.size} />
        </mesh>
      ))}
    </group>
  )
}

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
