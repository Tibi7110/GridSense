export function EnergyVillage() {
  return (
    <svg
      className="energy-village"
      viewBox="0 0 540 320"
      fill="none"
      role="img"
      aria-labelledby="village-title"
    >
      <title id="village-title">
        Case cu panouri solare conectate într-o comunitate verde
      </title>
      <defs>
        <linearGradient
          id="island"
          x1="270"
          y1="110"
          x2="270"
          y2="320"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#487967" />
          <stop offset="1" stopColor="#214E42" />
        </linearGradient>
        <pattern
          id="solar"
          width="15"
          height="12"
          patternUnits="userSpaceOnUse"
          patternTransform="skewY(26)"
        >
          <rect width="15" height="12" fill="#17463F" />
          <path d="M0 0H15V12" stroke="#7CB5A7" strokeWidth=".7" />
        </pattern>
      </defs>
      <circle cx="420" cy="66" r="31" fill="#D5EA8E" opacity=".95" />
      <circle cx="420" cy="66" r="43" stroke="#D5EA8E" strokeOpacity=".16" />
      <circle cx="420" cy="66" r="55" stroke="#D5EA8E" strokeOpacity=".08" />
      <path d="M44 212 262 105 506 215 287 316Z" fill="#113A30" opacity=".5" />
      <path d="m44 194 218-99 244 106v16L287 316 44 210Z" fill="url(#island)" />
      <path d="m44 194 218-99 244 106-219 101Z" fill="#527E66" />
      <path
        d="m100 205 144-67 197 84M198 277l177-80"
        stroke="#9BB29A"
        strokeWidth="18"
      />
      <path
        d="m100 205 144-67 197 84M198 277l177-80"
        stroke="#C6D2A6"
        strokeWidth="2"
        strokeDasharray="6 7"
      />
      <path
        className="energy-flow"
        d="m133 200 84 40 171-75"
        stroke="#D8F396"
        strokeWidth="2"
        strokeDasharray="5 6"
      />
      <g>
        <path d="m200 127 57 27v68l-57-28Z" fill="#EAE8D6" />
        <path d="m257 154 67-31v68l-67 31Z" fill="#BCCABB" />
        <path d="m257 69 80 57-80 37-70-34Z" fill="#375B50" />
        <path d="m217 122 41-36 55 39-55 26Z" fill="url(#solar)" />
        <path d="m217 160 18 9v25l-18-9Z" fill="#567B68" />
        <path d="m269 171 15-7v23l-15 7Zm29-13 15-7v23l-15 7Z" fill="#E7D69C" />
        <path d="m245 82 10-5 9 4v25l-9 4-10-5Z" fill="#DDE2C9" />
      </g>
      <g>
        <path d="m94 198 43 20v44l-43-20Z" fill="#E6E7D6" />
        <path d="m137 218 46-22v44l-46 22Z" fill="#B8C8AF" />
        <path d="m83 198 45-42 65 43-56 27Z" fill="#8EA783" />
        <path d="m101 191 28-25 44 30-35 17Z" fill="url(#solar)" />
        <path d="m107 220 13 6v17l-13-6Z" fill="#6A8B72" />
        <path d="m150 225 17-8v18l-17 8Z" fill="#F0D99B" />
      </g>
      <g>
        <path d="m350 191 40 18v44l-40-19Z" fill="#E6E7D6" />
        <path d="m390 209 47-22v44l-47 22Z" fill="#BACBB8" />
        <path d="m339 191 48-41 60 40-57 27Z" fill="#7F9D82" />
        <path d="m358 184 30-24 41 28-38 17Z" fill="url(#solar)" />
        <path d="m363 211 13 6v18l-13-6Z" fill="#658775" />
        <path d="m403 217 18-8v17l-18 8Z" fill="#F0D99B" />
      </g>
      {[
        [78, 166],
        [177, 139],
        [335, 135],
        [452, 204],
        [293, 257],
        [197, 262],
      ].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <ellipse cy="23" rx="14" ry="6" fill="#214D3D" opacity=".3" />
          <path d="M0 0v24" stroke="#C8C9A1" strokeWidth="4" />
          <path
            d="M0-37C-22-16-23 8 0 11 23 8 22-16 0-37Z"
            fill={i % 2 ? "#B5CE81" : "#8DB574"}
          />
          <path
            d="M0-20v29"
            stroke="#678A58"
            strokeOpacity=".45"
            strokeWidth="1.5"
          />
        </g>
      ))}
      <g transform="translate(374 102)">
        <path d="M0 0v61" stroke="#BECDB7" strokeWidth="4" />
        <g className="turbine-blades">
          <path
            d="M0 0-4-37 3-37 4-5ZM0 0l34 15-4 6-30-16ZM0 0l-27 23-4-6L-5-2Z"
            fill="#DCE4C9"
          />
          <circle r="5" fill="#D8ED9C" />
        </g>
      </g>
      <g transform="translate(279 241)">
        <rect x="-14" y="-21" width="28" height="38" rx="6" fill="#D8ED9C" />
        <path d="m3-13-10 14h8l-4 9L8-4H0Z" fill="#2C5742" />
      </g>
      <circle cx="157" cy="92" r="4" fill="#D8ED9C" opacity=".7" />
      <path
        d="M120 66h9m-4.5-4.5v9M472 140h9m-4.5-4.5v9"
        stroke="#D8ED9C"
        opacity=".5"
        strokeWidth="2"
      />
    </svg>
  );
}
