'use client'

import { fr } from '@codegouvfr/react-dsfr'
import { tss } from 'tss-react'
import { GeoApiCommuneResult, GeoApiEpciResult, GeoApiSearchResults } from '~/hooks/use-geoapi-search'

interface AutocompleteResultsProps {
  data: GeoApiSearchResults
  onClick: (item: GeoApiCommuneResult | GeoApiEpciResult) => void
  /** Affiche les communes avant les EPCI. */
  communesFirst?: boolean
}

export const AutocompleteResults = ({ data, onClick, communesFirst = false }: AutocompleteResultsProps) => {
  const { classes } = useStyles()
  const hasCommunes = data.communes.length > 0
  const hasEpcis = data.epcis.length > 0

  const epcis = hasEpcis && (
    <>
      <span className={fr.cx('fr-text--bold')}>Résultat de recherche par EPCI :</span>
      {data.epcis.map((item) => (
        <li className={classes.liItem} onClick={() => onClick(item)} key={`epci-${item.code}`}>
          {item.nom} ({item.code})
        </li>
      ))}
    </>
  )
  const communes = hasCommunes && (
    <>
      <span className={fr.cx('fr-text--bold')}>Résultat de recherche par commune :</span>
      {data.communes.map((item) => (
        <li className={classes.liItem} onClick={() => onClick(item)} key={`commune-${item.code}`}>
          {item.nom} ({item.code})
        </li>
      ))}
    </>
  )

  return (
    <div className={classes.container}>
      <ul className={classes.ulContainer}>
        {communesFirst ? communes : epcis}
        {hasCommunes && hasEpcis && <div className={classes.separator} />}
        {communesFirst ? epcis : communes}
      </ul>
    </div>
  )
}

const useStyles = tss.create({
  container: {
    backgroundColor: fr.colors.decisions.background.default.grey.default,
    border: '1px solid #ccc',
    borderTop: 'none',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    left: 0,
    maxHeight: '200px',
    overflowY: 'auto',
    position: 'absolute',
    right: 0,
    top: '100%',
    zIndex: 1000,
  },
  liItem: {
    ':hover': {
      textDecoration: 'underline',
    },
    cursor: 'pointer',
  },
  separator: {
    borderTop: '1px solid #ccc',
    margin: '1rem 0',
  },
  ulContainer: {
    listStyle: 'none',
    margin: 0,
    padding: '1rem',
  },
})
