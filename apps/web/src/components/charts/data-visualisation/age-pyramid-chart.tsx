'use client'

import Alert from '@codegouvfr/react-dsfr/Alert'
import Range from '@codegouvfr/react-dsfr/Range'
import { SegmentedControl, type SegmentedControlProps } from '@codegouvfr/react-dsfr/SegmentedControl'
import Select from '@codegouvfr/react-dsfr/Select'
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { FC, useMemo } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, TooltipProps, XAxis, YAxis } from 'recharts'
import { NameType, Payload as TooltipPayload, ValueType } from 'recharts/types/component/DefaultTooltipContent'
import { tss } from 'tss-react'
import { getChartColor } from '~/components/charts/data-visualisation/colors'
import { sumAgeRange, type TAgePyramid, type TAgePyramidAvailable, toAgePyramidBands, totalAtYear } from '~/schemas/age-pyramid'
import { formatNumber } from '~/utils/format-numbers'

const POPULATION_TYPE_OPTIONS = [
  { label: 'Population haute', value: 'haute' },
  { label: 'Population centrale', value: 'central' },
  { label: 'Population basse', value: 'basse' },
]

const UNAVAILABLE_MESSAGE: Record<string, string> = {
  NO_PROJECTION:
    "Ce territoire n'a pas de projection détaillée : il compte moins de 50 000 habitants et son bassin d'habitat n'est pas projeté non plus.",
  AMBIGUOUS_BASSIN:
    'Ce territoire appartient à un bassin partagé par plusieurs zones de projection dont certaines ne sont pas projetées. Les additionner donnerait un total faussé.',
}

/**
 * Largeur de la gouttière centrale, qui accueille les libellés d'âge.
 *
 * Les libellés sont rendus hors de recharts, dans une colonne intercalée entre les deux panneaux.
 * Portés par un axe des ordonnées, ils se faisaient rogner par le viewport du SVG dès qu'on les
 * décalait pour les centrer, et la position exacte d'une graduation d'axe `orientation="right"`
 * n'est pas vérifiable — recharts 3 ne rend rien côté serveur.
 *
 * En colonne DOM, l'alignement se calcule : les deux panneaux ont la même hauteur, les mêmes
 * marges et un axe des abscisses de hauteur fixée, donc leurs aires de tracé occupent la même
 * bande verticale, que la colonne reproduit avec les mêmes retraits.
 */
const GUTTER = 56

/** Marges verticales des deux graphiques, reprises par la colonne de libellés. */
const MARGIN_TOP = 8
const MARGIN_BOTTOM = 8

/** Hauteur imposée à l'axe des abscisses, pour que la bande de tracé soit calculable. */
const X_AXIS_HEIGHT = 30

/** Une ligne du graphique : une tranche d'âge, ses effectifs et ceux de l'année de référence. */
type PyramidRow = {
  label: string
  ageFrom: number
  ageTo: number
  men: number
  women: number
  menRef: number
  womenRef: number
  /** Référence de la tranche du dessus, `null` sur la première — sert à fermer l'escalier. */
  menRefAbove: number | null
  womenRefAbove: number | null
  isLast: boolean
}

type PyramidBarProps = {
  x?: number
  y?: number
  width?: number
  height?: number
  background?: { x: number; y: number; width: number; height: number }
  payload?: PyramidRow
  fill?: string
  domainMax: number
  /** Panneau des hommes : axe inversé, les valeurs croissent vers la gauche. */
  reversed: boolean
  side: 'men' | 'women'
}

/**
 * Barre d'une tranche, avec le tronçon d'escalier de l'année de référence.
 *
 * Recharts ne sait pas tracer ce contour : deux séries de barres dans une même catégorie se rangent
 * côte à côte au lieu de se superposer, et ses courbes `step` décalent la silhouette d'une
 * demi-tranche — la position d'un point sur un axe catégoriel étant le centre de la bande, pas ses
 * bords. Le contour est donc dessiné ici, à partir de la géométrie que recharts calcule.
 *
 * `background` couvre toute la largeur de l'aire de tracé pour cette ligne : il donne l'échelle
 * valeur → pixel sans dépendre de la longueur de la barre, donc y compris quand elle vaut zéro.
 */
export const PyramidBar: FC<PyramidBarProps> = ({ x, y, width, height, background, payload, fill, domainMax, reversed, side }) => {
  if (x === undefined || y === undefined || width === undefined || height === undefined) return null
  if (background === undefined || payload === undefined || domainMax <= 0) return null

  const toPixels = (value: number) => {
    const ratio = value / domainMax
    return reversed ? background.x + background.width * (1 - ratio) : background.x + background.width * ratio
  }

  const zeroX = toPixels(0)
  const reference = side === 'men' ? payload.menRef : payload.womenRef
  const above = side === 'men' ? payload.menRefAbove : payload.womenRefAbove
  const referenceX = toPixels(reference)

  // L'escalier se ferme sur l'axe en haut de la première tranche et en bas de la dernière ; entre
  // deux tranches, le tronçon horizontal rejoint la valeur de celle du dessus.
  const segments = [
    `M${toPixels(above ?? 0)},${y}`,
    `L${referenceX},${y}`,
    `L${referenceX},${y + height}`,
    ...(payload.isLast ? [`L${zeroX},${y + height}`] : []),
  ]

  // 1 px de retrait : les tranches voisines gardent un filet de fond entre elles.
  const inset = height > 6 ? 1 : 0

  return (
    <g>
      <rect x={Math.min(x, x + width)} y={y + inset} width={Math.abs(width)} height={Math.max(0, height - inset * 2)} fill={fill} />
      <path d={segments.join(' ')} stroke="var(--text-mention-grey)" strokeWidth={1.5} fill="none" strokeLinejoin="round" />
    </g>
  )
}

/**
 * Colonne des libellés d'âge, calée sur l'aire de tracé des deux panneaux.
 *
 * Les retraits reprennent les marges des graphiques et la hauteur de l'axe des abscisses ; les
 * lignes se partagent ensuite la hauteur restante à parts égales, exactement comme recharts répartit
 * les bandes d'un axe catégoriel avec `barCategoryGap={0}`.
 */
const AgeGutter: FC<{ rows: PyramidRow[]; showEvery: number }> = ({ rows, showEvery }) => {
  const { classes } = useStyles()
  return (
    <div
      className={classes.gutter}
      style={{ width: GUTTER, paddingTop: MARGIN_TOP, paddingBottom: MARGIN_BOTTOM + X_AXIS_HEIGHT }}
      aria-hidden
    >
      {rows.map((row, index) => (
        <span key={row.label}>{index % showEvery === 0 ? row.label : ''}</span>
      ))}
    </div>
  )
}

const PyramidTooltip = ({
  active,
  payload,
  referenceYear,
  year,
  unit,
}: TooltipProps<ValueType, NameType> & {
  payload?: TooltipPayload<ValueType, NameType>[]
  referenceYear: number
  year: number
  unit: 'effectifs' | 'parts'
}) => {
  const { classes } = useStyles()
  const row = payload?.[0]?.payload as PyramidRow | undefined
  if (!active || row === undefined) return null

  const format = (value: number) => (unit === 'parts' ? `${value.toFixed(2)} %` : formatNumber(Math.round(value)))
  const delta = (from: number, to: number) => `${to > from ? '+' : to < from ? '−' : ''}${format(Math.abs(to - from))}`

  const rows: [string, string, string][] = [
    [`Hommes ${year}`, format(row.men), delta(row.menRef, row.men)],
    [`Femmes ${year}`, format(row.women), delta(row.womenRef, row.women)],
  ]

  return (
    <div className={classes.tooltip}>
      <p className={classes.tooltipTitle}>{row.ageFrom === row.ageTo ? `${row.ageFrom} ans` : `${row.ageFrom} à ${row.ageTo} ans`}</p>
      {rows.map(([label, value, difference]) => (
        <p key={label} className={classes.tooltipRow}>
          <span>{label}</span>
          <span>
            {value}{' '}
            <span className={classes.tooltipDelta}>
              ({difference} vs {referenceYear})
            </span>
          </span>
        </p>
      ))}
    </div>
  )
}

export const AgePyramidChart: FC<{ data: TAgePyramid }> = ({ data }) => {
  const { classes } = useStyles()
  const [queryStates, setQueryStates] = useQueryStates({
    populationType: parseAsString.withDefault('haute'),
    pyramidYear: parseAsInteger,
    pyramidDensity: parseAsString.withDefault('quinquennal'),
    pyramidUnit: parseAsString.withDefault('effectifs'),
  })

  const density = queryStates.pyramidDensity === 'age' ? 'age' : 'quinquennal'
  const unit = queryStates.pyramidUnit === 'parts' ? 'parts' : 'effectifs'
  const available = data.available ? data : null

  const view = useMemo(
    () => (available === null ? null : buildView(available, queryStates.pyramidYear, density, unit)),
    [available, queryStates.pyramidYear, density, unit],
  )

  const populationTypeSelect = (
    <Select
      label="Variante de population"
      className="fr-mb-0"
      nativeSelectProps={{
        onChange: (event) => setQueryStates({ populationType: event.target.value }),
        value: queryStates.populationType || '',
      }}
    >
      {POPULATION_TYPE_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  )

  if (available === null || view === null) {
    return (
      <div className={classes.container}>
        {populationTypeSelect}
        <Alert
          severity="info"
          title="Pyramide des âges indisponible"
          description={UNAVAILABLE_MESSAGE[data.available ? 'NO_PROJECTION' : data.reason]}
        />
      </div>
    )
  }

  const { rows, domainMax, year, referenceYear, facts } = view
  const height = density === 'age' ? 900 : 560
  const formatAxis = (value: number) => (unit === 'parts' ? `${value.toFixed(1)}` : formatNumber(value))

  // Les deux moitiés ne diffèrent que par le sens de l'axe et la série tracée : tout le reste doit
  // rester identique, faute de quoi les lignes ne seraient plus en regard.
  const halfChart = (side: 'men' | 'women') => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={rows} layout="vertical" margin={{ top: MARGIN_TOP, right: 0, bottom: MARGIN_BOTTOM, left: 0 }} barCategoryGap={0}>
        <XAxis
          type="number"
          domain={[0, domainMax]}
          reversed={side === 'men'}
          tickFormatter={formatAxis}
          tickLine={false}
          fontSize={12}
          height={X_AXIS_HEIGHT}
        />
        {/* Masqué : les libellés vivent dans la colonne centrale, hors des SVG. */}
        <YAxis type="category" dataKey="label" hide />
        <Tooltip
          cursor={{ fill: 'var(--background-alt-grey)' }}
          content={<PyramidTooltip referenceYear={referenceYear} year={year} unit={unit} />}
        />
        <Bar
          dataKey={side}
          fill={getChartColor(side === 'men' ? 'pyramidMen' : 'pyramidWomen')}
          isAnimationActive={false}
          shape={<PyramidBar domainMax={domainMax} reversed={side === 'men'} side={side} />}
        />
      </BarChart>
    </ResponsiveContainer>
  )

  return (
    <div className={classes.container}>
      {available.coverage === 'BASSIN' && (
        <Alert
          small
          severity="info"
          description={`Cet EPCI n'a pas de projection détaillée propre. Les effectifs présentés sont ceux de son bassin d'habitat « ${available.zone.label} ».`}
        />
      )}

      <div className={classes.controls}>
        {populationTypeSelect}

        <SegmentedControl
          legend="Densité"
          small
          segments={
            [
              {
                label: 'Quinquennal',
                nativeInputProps: {
                  checked: density === 'quinquennal',
                  onChange: () => setQueryStates({ pyramidDensity: 'quinquennal' }),
                },
              },
              {
                label: 'Âge par âge',
                nativeInputProps: {
                  checked: density === 'age',
                  onChange: () => setQueryStates({ pyramidDensity: 'age' }),
                },
              },
            ] as SegmentedControlProps['segments']
          }
        />

        <SegmentedControl
          legend="Unité"
          small
          segments={
            [
              {
                label: 'Effectifs',
                nativeInputProps: {
                  checked: unit === 'effectifs',
                  onChange: () => setQueryStates({ pyramidUnit: 'effectifs' }),
                },
              },
              {
                label: 'Part de la population',
                nativeInputProps: {
                  checked: unit === 'parts',
                  onChange: () => setQueryStates({ pyramidUnit: 'parts' }),
                },
              },
            ] as SegmentedControlProps['segments']
          }
        />
      </div>

      <Range
        label={`Année comparée à ${referenceYear}`}
        hintText={`${year}`}
        min={available.years[0]}
        max={available.years[available.years.length - 1]}
        step={1}
        small
        nativeInputProps={{
          value: year,
          onChange: (event) => setQueryStates({ pyramidYear: Number(event.target.value) }),
        }}
      />

      <dl className={classes.facts}>
        {facts.map((fact) => (
          <div key={fact.label} className={classes.fact}>
            <dt>{fact.label}</dt>
            <dd>
              {fact.value}
              {fact.hint !== undefined && <small> {fact.hint}</small>}
            </dd>
          </div>
        ))}
      </dl>

      <div>
        <div className={classes.headers}>
          <span style={{ color: getChartColor('pyramidMen') }}>Hommes</span>
          <span style={{ color: getChartColor('pyramidWomen') }}>Femmes</span>
        </div>

        <div className={classes.halves} style={{ height }}>
          <div className={classes.half}>{halfChart('men')}</div>
          <AgeGutter rows={rows} showEvery={density === 'age' ? 10 : 1} />
          <div className={classes.half}>{halfChart('women')}</div>
        </div>

        <p className={classes.unit}>{unit === 'parts' ? '% de la population totale' : 'habitants'}</p>
      </div>

      <div className={classes.legend}>
        <span>
          <i style={{ backgroundColor: getChartColor('pyramidMen') }} />
          Hommes {year}
        </span>
        <span>
          <i style={{ backgroundColor: getChartColor('pyramidWomen') }} />
          Femmes {year}
        </span>
        <span>
          <i className={classes.legendOutline} />
          Profil {referenceYear}
        </span>
      </div>
    </div>
  )
}

type PyramidView = {
  rows: PyramidRow[]
  domainMax: number
  year: number
  referenceYear: number
  facts: { label: string; value: string; hint?: string }[]
}

/**
 * Prépare les lignes du graphique pour une année.
 *
 * Le domaine de l'axe est calculé sur **toutes** les années, pas sur l'année affichée : sans cela
 * déplacer le curseur ferait bouger l'échelle sous des barres de longueur constante, et le
 * vieillissement deviendrait invisible.
 */
function buildView(
  data: TAgePyramidAvailable,
  requestedYear: number | null,
  density: 'quinquennal' | 'age',
  unit: 'effectifs' | 'parts',
): PyramidView {
  const lastYear = data.years[data.years.length - 1]
  const year = requestedYear !== null && data.years.includes(requestedYear) ? requestedYear : lastYear
  const yearIndex = data.years.indexOf(year)
  const referenceIndex = data.years.indexOf(data.referenceYear)
  const referenceYear = referenceIndex === -1 ? data.years[0] : data.referenceYear
  const safeReferenceIndex = referenceIndex === -1 ? 0 : referenceIndex

  const scaleOf = (index: number) => (unit === 'parts' ? 100 / (totalAtYear(data.ages, index) || 1) : 1)
  const currentScale = scaleOf(yearIndex)
  const referenceScale = scaleOf(safeReferenceIndex)

  const bands = toAgePyramidBands(data.ages, safeReferenceIndex, yearIndex, density)

  const rows: PyramidRow[] = bands.map((band, index) => {
    const above = index === 0 ? null : bands[index - 1]
    return {
      label: band.label,
      ageFrom: band.ageFrom,
      ageTo: band.ageTo,
      men: band.men * currentScale,
      women: band.women * currentScale,
      menRef: band.menRef * referenceScale,
      womenRef: band.womenRef * referenceScale,
      menRefAbove: above === null ? null : above.menRef * referenceScale,
      womenRefAbove: above === null ? null : above.womenRef * referenceScale,
      isLast: index === bands.length - 1,
    }
  })

  let domainMax = 0
  for (let index = 0; index < data.years.length; index++) {
    const scale = scaleOf(index)
    for (const band of toAgePyramidBands(data.ages, index, index, density)) {
      domainMax = Math.max(domainMax, band.men * scale, band.women * scale)
    }
  }

  const percent = (from: number, to: number) =>
    from === 0 ? '—' : `${to >= from ? '+' : '−'}${(Math.abs(to / from - 1) * 100).toFixed(1)} %`

  const referenceTotal = totalAtYear(data.ages, safeReferenceIndex)
  const currentTotal = totalAtYear(data.ages, yearIndex)
  const elderlyFrom = sumAgeRange(data.ages, safeReferenceIndex, 85, 99)
  const elderlyTo = sumAgeRange(data.ages, yearIndex, 85, 99)
  const youngFrom = sumAgeRange(data.ages, safeReferenceIndex, 0, 19)
  const youngTo = sumAgeRange(data.ages, yearIndex, 0, 19)

  return {
    rows,
    domainMax: domainMax || 1,
    year,
    referenceYear,
    facts: [
      { label: `Population ${referenceYear}`, value: formatNumber(Math.round(referenceTotal)) },
      {
        label: `Population ${year}`,
        value: formatNumber(Math.round(currentTotal)),
        hint: percent(referenceTotal, currentTotal),
      },
      {
        label: '85 ans et plus',
        value: `${formatNumber(Math.round(elderlyFrom))} → ${formatNumber(Math.round(elderlyTo))}`,
        hint: percent(elderlyFrom, elderlyTo),
      },
      {
        label: 'Moins de 20 ans',
        value: `${formatNumber(Math.round(youngFrom))} → ${formatNumber(Math.round(youngTo))}`,
        hint: percent(youngFrom, youngTo),
      },
    ],
  }
}

const useStyles = tss.create({
  container: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  controls: { display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-end' },
  headers: {
    display: 'flex',
    fontSize: '0.8125rem',
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    '& span': { flex: 1 },
    // Aligné sur les aires de tracé : la gouttière est retranchée à droite du panneau des hommes,
    // le panneau des femmes commence à son bord gauche.
    // Les deux moitiés encadrent la gouttière : chaque intitulé se cale sur le bord intérieur de
    // son panneau.
    '& span:first-of-type': { textAlign: 'right', paddingRight: `${GUTTER / 2}px` },
    '& span:last-of-type': { textAlign: 'left', paddingLeft: `${GUTTER / 2}px` },
  },
  halves: { display: 'flex', width: '100%', minWidth: 0 },
  half: { flex: '1 1 0', minWidth: 0 },
  gutter: {
    flex: '0 0 auto',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    // Chaque ligne occupe une part égale de la bande de tracé, comme les bandes de recharts.
    '& span': {
      flex: '1 1 0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.6875rem',
      lineHeight: 1,
      color: 'var(--text-mention-grey)',
      fontVariantNumeric: 'tabular-nums',
      whiteSpace: 'nowrap',
    },
  },
  unit: { textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-mention-grey)', margin: '0.25rem 0 0' },
  facts: {
    display: 'flex',
    flexWrap: 'wrap',
    margin: 0,
    border: '1px solid var(--border-default-grey)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  fact: {
    flex: '1 1 12rem',
    padding: '0.75rem 1rem',
    borderRight: '1px solid var(--border-default-grey)',
    '&:last-child': { borderRight: 0 },
    '& dt': { fontSize: '0.8125rem', color: 'var(--text-mention-grey)' },
    '& dd': { margin: '0.15rem 0 0', fontWeight: 600, fontVariantNumeric: 'tabular-nums' },
    '& small': { fontWeight: 400, color: 'var(--text-mention-grey)' },
  },
  legend: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1.25rem',
    fontSize: '0.8125rem',
    '& i': { display: 'inline-block', width: '1.35rem', height: '0.7rem', marginRight: '0.45rem', verticalAlign: '-1px' },
  },
  legendOutline: { height: 0, borderTop: '2px solid var(--text-mention-grey)' },
  tooltip: {
    backgroundColor: 'var(--background-default-grey)',
    border: '1px solid var(--border-default-grey)',
    borderRadius: '4px',
    padding: '0.6rem 0.7rem',
    fontSize: '0.8125rem',
  },
  tooltipTitle: { margin: '0 0 0.4rem', fontWeight: 600 },
  tooltipRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1.5rem',
    margin: 0,
    fontVariantNumeric: 'tabular-nums',
  },
  tooltipDelta: { color: 'var(--text-mention-grey)' },
})
