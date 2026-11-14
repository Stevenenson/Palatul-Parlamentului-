/**
 * Meandru (greacă): singurul ornament al paginii, desenat din cod. E decorativ și
 * ascuns cititoarelor de ecran. Cu `draw`, linia se desenează singură, ca semn de încărcare.
 */
export function Meander({ units = 5, draw = false }: { units?: number; draw?: boolean }) {
  const step = 20
  let path = ''
  for (let i = 0; i < units; i++) path += `M${i * step} 10h15v-9h-10v5h5`
  return (
    <svg
      className="meander"
      data-draw={draw || undefined}
      viewBox={`-1 0 ${units * step - 3} 11`}
      width={units * step - 3}
      height={11}
      aria-hidden="true"
    >
      <path d={path} pathLength={draw ? 100 : undefined} />
    </svg>
  )
}
