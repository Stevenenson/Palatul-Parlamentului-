/**
 * Desen în cerneală: mutarea bisericii Mănăstirii Mihai Vodă, în 1985. Sus, planul (schematic,
 * fără scară): locul inițial pe deal, drumul pe șine și locul nou. Jos, profilul coborârii.
 * Liniile se trasează o dată, când desenul intră în ecran (clasa `is-drawn`, pusă de pagină).
 */

/** Planul unei biserici triconce, cu altarul spre dreapta (est), centrat în 0,0. */
const CHURCH =
  'M-30 -11H-9A9 9 0 0 1 9 -11H17A11 11 0 0 1 17 11H9A9 9 0 0 1 -9 11H-30Z M-42 -7H-30V7H-42Z'

const ROUTE = 'M196 132C292 140 372 214 456 244'

export function MihaiVodaDrawing() {
  return (
    <svg
      className="drawing"
      viewBox="0 0 640 380"
      role="img"
      aria-label="Desen schematic: biserica pleacă de pe vârful dealului, merge pe șine 289 de metri și coboară 6,2 metri până în strada Sapienței."
    >
      <g className="drawing__contours">
        <path d="M150 58C222 54 262 98 252 136C242 178 186 196 130 188C70 180 46 144 58 108C68 78 98 60 150 58Z" />
        <path d="M150 24C254 18 310 82 298 140C286 206 200 236 120 226C34 216 6 160 20 106C32 58 80 28 150 24Z" />
        <path d="M152 -6C286 -12 352 70 340 146C326 232 214 270 110 260C10 250 -26 176 -16 104" />
      </g>

      <g className="drawing__route">
        <path className="drawing__sleepers" d={ROUTE} />
        <path className="drawing__line" d={ROUTE} transform="translate(0 -4)" pathLength={1} />
        <path className="drawing__line" d={ROUTE} transform="translate(0 4)" pathLength={1} />
        <path className="drawing__line drawing__arrow" d="M440 230l18 15-23 4" pathLength={1} />
      </g>

      <g className="drawing__church drawing__church--old" transform="translate(150 124)">
        <path d={CHURCH} />
      </g>
      <g className="drawing__church drawing__church--new" transform="translate(500 254) rotate(14)">
        <path d={CHURCH} />
      </g>

      <g className="drawing__labels">
        <text x="150" y="166" textAnchor="middle">
          locul inițial, pe deal
        </text>
        <text x="500" y="298" textAnchor="middle">
          strada Sapienței
        </text>
        <text className="drawing__value" x="318" y="160" transform="rotate(26 318 160)">
          289 m
        </text>
      </g>

      <g className="drawing__profile">
        <path className="drawing__ground" d="M24 334H200C268 334 300 360 372 360H616" pathLength={1} />
        <path className="drawing__dim" d="M600 334V360M592 334H608M592 360H608" />
        <text className="drawing__value" x="590" y="351" textAnchor="end">
          6,2 m
        </text>
        <text x="24" y="322">
          profil, înălțimi exagerate
        </text>
      </g>
    </svg>
  )
}
