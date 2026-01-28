'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Checkbox from '@codegouvfr/react-dsfr/Checkbox'
import Select from '@codegouvfr/react-dsfr/Select'
import { parseAsString, useQueryStates } from 'nuqs'
import { FC, useState } from 'react'
import type { TooltipContentProps } from 'recharts'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { tss } from 'tss-react'
import { DATA_TYPE_OPTIONS } from '~/components/data-visualisation/select-data-type'
import { TInadequateHousing } from '~/schemas/population-evolution'
import { formatNumber } from '~/utils/format-numbers'
import styles from './accommodation-evolution-charts.module.css'
import { getChartColor } from './colors'

interface BadHousingChartProps {
  data: TInadequateHousing
}

export const BadHousingChart: FC<BadHousingChartProps> = ({ data }) => {
  const [withOteloParams, setWithOteloParams] = useState(false)
  const [queryStates, setQueryStates] = useQueryStates({
    type: parseAsString,
    epci: parseAsString,
  })
  const { classes } = useStyles()

  const chartData = [
    {
      name: data[queryStates.epci as string].name,
      noAccommodation: data[queryStates.epci as string].noAccommodation.total,
      hosted: data[queryStates.epci as string].hosted.total,
      financialInadequation: data[queryStates.epci as string].financialInadequation,
      badQuality: data[queryStates.epci as string].badQuality,
      physicalInadequation: data[queryStates.epci as string].physicalInadequation,
    },
  ]
  const chartDataOteloParams = [
    {
      name: chartData[0].name,
      noAccommodation: chartData[0].noAccommodation * 0.5,
      hosted: chartData[0].hosted * 0.3,
      financialInadequation: chartData[0].financialInadequation * 0.3,
      badQuality: chartData[0].badQuality * 0.5,
      physicalInadequation: chartData[0].physicalInadequation * 0.9,
    },
  ]

  const title = DATA_TYPE_OPTIONS.find((option) => option.value === queryStates.type)?.label
  const EPCIS_OPTIONS = Object.entries(data).map(([key, value]) => ({ label: value.name, value: key }))
  const dataToDisplay = withOteloParams ? chartDataOteloParams : chartData
  const homelessMakeshiftHotelSum =
    data[queryStates.epci as string].noAccommodation.hotel +
    data[queryStates.epci as string].noAccommodation.homeless +
    data[queryStates.epci as string].noAccommodation.makeShiftHousing
  const name = data[queryStates.epci as string].name
  const chartTitle = withOteloParams
    ? `Graphique sur les situations de mal-logement traduites en besoins en logements supplémentaires à ${name}`
    : `Graphique sur les situations de mal logement à ${name}`
  // Calculate total volume and max value for Otelo params description
  const totalVolume = withOteloParams
    ? Math.round(
        chartDataOteloParams[0].badQuality +
          chartDataOteloParams[0].financialInadequation +
          chartDataOteloParams[0].physicalInadequation +
          chartDataOteloParams[0].hosted +
          chartDataOteloParams[0].noAccommodation,
      )
    : 0

  const maxValue = withOteloParams
    ? Math.round(
        Math.max(
          chartDataOteloParams[0].badQuality,
          chartDataOteloParams[0].financialInadequation,
          chartDataOteloParams[0].physicalInadequation,
          chartDataOteloParams[0].hosted,
          chartDataOteloParams[0].noAccommodation,
        ),
      )
    : 0

  // Find which category has the maximum value
  const getMaxCategoryLabel = () => {
    if (!withOteloParams) return ''

    const values = {
      badQuality: Math.round(chartDataOteloParams[0].badQuality),
      financialInadequation: Math.round(chartDataOteloParams[0].financialInadequation),
      physicalInadequation: Math.round(chartDataOteloParams[0].physicalInadequation),
      hosted: Math.round(chartDataOteloParams[0].hosted),
      noAccommodation: Math.round(chartDataOteloParams[0].noAccommodation),
    }

    const maxKey = Object.keys(values).reduce((a, b) => (values[a as keyof typeof values] > values[b as keyof typeof values] ? a : b))

    const categoryLabels = {
      badQuality: 'logements de mauvaise qualité',
      financialInadequation: 'ménages ayant un loyer trop élevé',
      physicalInadequation: 'logements suroccupés',
      hosted: 'personnes hébergées',
      noAccommodation: 'personnes hors logements',
    }

    return categoryLabels[maxKey as keyof typeof categoryLabels]
  }

  const maxPercentage = totalVolume > 0 ? Math.round((maxValue / totalVolume) * 100) : 0

  const legendOrder = [
    { dataKey: 'noAccommodation', name: 'Sans logement', color: getChartColor('noAccommodation') },
    { dataKey: 'hosted', name: 'Hébergés', color: getChartColor('hosted') },
    { dataKey: 'financialInadequation', name: 'Inadéquation financière', color: getChartColor('financialInadequation') },
    { dataKey: 'badQuality', name: 'Mauvaise qualité', color: getChartColor('badQuality') },
    { dataKey: 'physicalInadequation', name: 'Inadéquation physique', color: getChartColor('physicalInadequation') },
  ]

  const customLegend = () => {
    return (
      <div className={classes.legend}>
        {legendOrder.map((entry) => (
          <div key={entry.dataKey} className={classes.legendItem}>
            <span className={classes.legendColorBox} style={{ backgroundColor: entry.color }} />
            <span className={classes.legendLabel}>{entry.name}</span>
          </div>
        ))}
      </div>
    )
  }

  const customTooltip = ({ active, payload, label }: TooltipContentProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className={classes.tooltip}>
          <p className={classes.tooltipTitle}>{label}</p>
          {legendOrder.map((entry) => {
            const payloadItem = payload.find((p) => p.dataKey === entry.dataKey)
            if (payloadItem && payloadItem.value && payloadItem.value > 0) {
              return (
                <div key={entry.dataKey} className={classes.tooltipRow}>
                  <span className={classes.tooltipColorBox} style={{ backgroundColor: entry.color }} />
                  <span className={classes.tooltipLabel}>
                    {entry.name}: <strong>{formatNumber(payloadItem.value)}</strong>
                  </span>
                </div>
              )
            }
            return null
          })}
        </div>
      )
    }
    return null
  }

  const chartDescription = withOteloParams ? (
    <>
      <p className={fr.cx('fr-mb-0')}>
        <span className={fr.cx('fr-text--bold')}>Clé de lecture :</span> Ce graphique présente une estimation du besoin en production de
        nouveaux logements induit par les situations de mal-logement identifiées sur le territoire de {name}. Chacune de ces situations ne
        génère pas nécessairement un besoin en logements supplémentaires : certaines peuvent être résolues par des actions sur le parc
        existant (réhabilitation, relogement, accompagnement social, etc.).
      </p>
      <p>
        Le passage du nombre de personnes mal-logées au besoin en logements repose sur un paramétrage par défaut, commun à l'ensemble des
        territoires. Ce paramétrage détermine, pour chaque type de situation, la part considérée comme nécessitant un logement
        supplémentaire.
      </p>
      <p className={fr.cx('fr-mb-0')}>
        Pour {name}, le paramétrage par défaut estime à {formatNumber(totalVolume)} le nombre de logements à produire pour résorber le
        mal-logement. Les {getMaxCategoryLabel()} représente {maxPercentage}% des besoins liés aux situations de mal-logement, soit{' '}
        {formatNumber(maxValue)} logements.
      </p>
      <p className={fr.cx('fr-mb-0')}>
        Pour en savoir plus sur le paramétrage par défaut (notamment les pourcentages appliqués par type de mal-logement), vous pouvez
        consulter le guide d'utilisation, onglet "Mal-logement", section "Paramétrage des besoins en logements neufs".
      </p>
    </>
  ) : (
    <>
      <p className={fr.cx('fr-mb-0')}>
        <span className={fr.cx('fr-text--bold')}>Clé de lecture :</span> Ce graphique présente le nombre de mal-logés par typologie de
        mal-logement sur le territoire de {name}. Chacune de ces situations ne génère pas nécessairement un besoin en logements
        supplémentaires : certaines peuvent être résolues par des actions sur le parc existant (réhabilitation, relogement, accompagnement
        social, etc.). La part à prendre en compte est paramétrable lors de l’élaboration d’un scenario, via l’espace “Paramétrer le
        mal-logement” de la page de résultat.
      </p>
      <p>On retrouve sur le territoire :</p>
      <ul>
        <li>
          <span className={fr.cx('fr-text--bold')}>Mauvaise qualité</span> : {formatNumber(chartData[0].badQuality)} ménages habitant un
          logement indigne, d’après le le Parc privé potentiellement indigne (2021) ;
        </li>
        <li>
          <span className={fr.cx('fr-text--bold')}>Inadéquation financière</span> : {formatNumber(chartData[0].financialInadequation)}
          &nbsp; ménages locataires du parc privé ayant un taux d’effort supérieur à 30% et bénéficiant des APL (CNAF 2022) ;
        </li>
        <li>
          <span className={fr.cx('fr-text--bold')}>Inadéquation physique</span> : {formatNumber(chartData[0].physicalInadequation)}
          &nbsp; ménages dans un logement trop petit. Les données fiscales (2021) sont mobilisées pour quantifier le nombre de propriétaires
          et locataires du parc privé vivant dans un logement comprenant deux pièces en moins ;
        </li>
        <li>
          <span className={fr.cx('fr-text--bold')}>Hébergés</span> :
          <ul>
            <li>
              {formatNumber(data[queryStates.epci as string].hosted.sne)} personnes hébergés chez un tiers, ou à titre temporaire d’après le
              SNE. ;
            </li>
            <li>{formatNumber(data[queryStates.epci as string].hosted.filocom)} familles dans une situation de cohabitation subie ;</li>
          </ul>
        </li>
        <li>
          <span className={fr.cx('fr-text--bold')}>Sans logement</span> :
          <ul>
            <li>
              {formatNumber(homelessMakeshiftHotelSum)} personnes sans abri, vivant en habitation de fortune, ou logées à l’hôtel, d’après
              les données du recensement de la population (2021). ;
            </li>
            <li>
              {formatNumber(data[queryStates.epci as string].noAccommodation.finess)} logés dans un hébergement d’urgence (FINESS 2022 -
              pour plus d’information sur les types d’hébergement d’urgence).
            </li>
          </ul>
        </li>
      </ul>
    </>
  )
  return (
    <>
      <div className={styles.headerContainer}>
        <h2 className={fr.cx('fr-h5')}>
          {title} - {name}
        </h2>
        <div>
          <Select
            label=""
            nativeSelectProps={{
              onChange: (event) => setQueryStates({ epci: event.target.value }),
              value: queryStates.epci || '',
            }}
          >
            {EPCIS_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
          <Checkbox
            options={[
              {
                label: 'Avec paramètres Otelo',
                nativeInputProps: {
                  checked: withOteloParams,
                  onChange: (event) => setWithOteloParams(event.target.checked),
                },
              },
            ]}
          />
        </div>
      </div>
      <div className={classes.chartContainer}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart width={500} height={300} data={dataToDisplay}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip content={customTooltip} />
            <Bar dataKey="noAccommodation" name="Sans logement" fill={getChartColor('noAccommodation')} />
            <Bar dataKey="hosted" name="Hébergés" fill={getChartColor('hosted')} />
            <Bar dataKey="financialInadequation" name="Inadéquation financière" fill={getChartColor('financialInadequation')} />
            <Bar dataKey="badQuality" name="Mauvaise qualité" fill={getChartColor('badQuality')} />
            <Bar dataKey="physicalInadequation" name="Inadéquation physique" fill={getChartColor('physicalInadequation')} />
            <Legend content={customLegend} />
          </BarChart>
        </ResponsiveContainer>
        <div className={classes.titleContainer}>
          <span className={classes.title}>{chartTitle}</span>
        </div>
      </div>
      <div>{chartDescription}</div>
    </>
  )
}

const useStyles = tss.create({
  chartContainer: {
    height: '600px',
    marginBottom: '2rem',
    paddingLeft: '2rem',
    paddingTop: '2rem',
    width: '100%',
  },
  title: {
    textAlign: 'center',
  },
  titleContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '1rem',
  },
  legend: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    justifyContent: 'center',
    marginTop: '1rem',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.8125rem',
  },
  legendColorBox: {
    width: '12px',
    height: '12px',
    flexShrink: 0,
  },
  legendLabel: {
    fontSize: '0.8125rem',
    color: '#161616',
  },
  tooltip: {
    backgroundColor: 'white',
    border: '1px solid #e5e5e5',
    borderRadius: '4px',
    padding: '0.75rem',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  tooltipTitle: {
    margin: '0 0 0.5rem 0',
    fontWeight: 700,
    fontSize: '14px',
    color: '#161616',
  },
  tooltipRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: '0.25rem',
  },
  tooltipColorBox: {
    width: '12px',
    height: '12px',
    flexShrink: 0,
  },
  tooltipLabel: {
    fontSize: '13px',
    color: '#3a3a3a',
  },
})
