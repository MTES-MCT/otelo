import { fr } from '@codegouvfr/react-dsfr'
import { FC } from 'react'
import { tss } from 'tss-react'
import { sPluriel } from '~/utils/sPluriel'

export type SelectionMethod = 'existing-group' | 'custom-selection' | 'bassin-habitat' | null

type MethodSelectionCardsProps = {
  selectedMethod: SelectionMethod
  onMethodSelect: (method: SelectionMethod) => void
  existingGroupsCount: number
}

export const MethodSelectionCards: FC<MethodSelectionCardsProps> = ({ selectedMethod, onMethodSelect, existingGroupsCount }) => {
  const { classes, cx } = useStyles({ selectedMethod })
  const showExistingGroup = existingGroupsCount > 0

  return (
    <div className={classes.container}>
      <h3 className={fr.cx('fr-h5', 'fr-mb-3w')}>Comment souhaitez-vous sélectionner les EPCI ?</h3>

      <div className={classes.cardsWrapper}>
        {showExistingGroup && (
          <button
            className={cx(
              classes.card,
              selectedMethod === 'existing-group' && classes.cardSelected,
              (selectedMethod === 'custom-selection' || selectedMethod === 'bassin-habitat') && classes.cardInactive,
            )}
            onClick={() => onMethodSelect('existing-group')}
            type="button"
          >
            <div className={classes.cardIcon}>
              <i className={fr.cx('fr-icon-folder-2-line', 'fr-icon--lg')} />
            </div>
            <div className={classes.cardContent}>
              <h4 className={classes.cardTitle}>Utiliser des territoires étudiés</h4>
              <p className={classes.cardDescription}>
                Sélectionnez parmi vos {existingGroupsCount} groupe{sPluriel(existingGroupsCount)} d'EPCI existant
                {sPluriel(existingGroupsCount)}
              </p>
            </div>
            {selectedMethod === 'existing-group' && (
              <div className={classes.selectedBadge}>
                <i className={fr.cx('fr-icon-checkbox-circle-fill')} />
              </div>
            )}
          </button>
        )}

        <button
          className={cx(
            classes.card,
            selectedMethod === 'bassin-habitat' && classes.cardSelected,
            (selectedMethod === 'existing-group' || selectedMethod === 'custom-selection') && classes.cardInactive,
          )}
          onClick={() => onMethodSelect('bassin-habitat')}
          type="button"
        >
          <div className={classes.cardIcon}>
            <i className={fr.cx('fr-icon-map-pin-2-line', 'fr-icon--lg')} />
          </div>
          <div className={classes.cardContent}>
            <h4 className={classes.cardTitle}>Choisir un Bassin d'Habitat</h4>
            <p className={classes.cardDescription}>Sélectionnez un bassin d'habitat prédéfini sans modification possible</p>
          </div>
          {selectedMethod === 'bassin-habitat' && (
            <div className={classes.selectedBadge}>
              <i className={fr.cx('fr-icon-checkbox-circle-fill')} />
            </div>
          )}
        </button>

        <button
          className={cx(
            classes.card,
            selectedMethod === 'custom-selection' && classes.cardSelected,
            (selectedMethod === 'existing-group' || selectedMethod === 'bassin-habitat') && classes.cardInactive,
          )}
          onClick={() => onMethodSelect('custom-selection')}
          type="button"
        >
          <div className={classes.cardIcon}>
            <i className={fr.cx('fr-icon-search-line', 'fr-icon--lg')} />
          </div>
          <div className={classes.cardContent}>
            <h4 className={classes.cardTitle}>Créer une sélection personnalisée</h4>
            <p className={classes.cardDescription}>Recherchez et sélectionnez les EPCI manuellement</p>
          </div>
          {selectedMethod === 'custom-selection' && (
            <div className={classes.selectedBadge}>
              <i className={fr.cx('fr-icon-checkbox-circle-fill')} />
            </div>
          )}
        </button>
      </div>
    </div>
  )
}

const useStyles = tss.withParams<{ selectedMethod: SelectionMethod }>().create(() => ({
  container: {
    marginBottom: fr.spacing('4w'),
  },
  cardsWrapper: {
    display: 'flex',
    gap: fr.spacing('3w'),
    alignItems: 'stretch',
    flexWrap: 'wrap',
  },
  card: {
    flex: 1,
    minWidth: '280px',
    padding: fr.spacing('3w'),
    border: `2px solid ${fr.colors.decisions.border.default.grey.default}`,
    borderRadius: '8px',
    backgroundColor: fr.colors.decisions.background.default.grey.default,
    cursor: 'pointer',
    position: 'relative',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: fr.spacing('2w'),
    transition: 'all 0.2s ease',
    '&:hover': {
      borderColor: fr.colors.decisions.border.actionHigh.blueFrance.default,
      backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
    },
  },
  cardSelected: {
    borderColor: fr.colors.decisions.border.actionHigh.blueFrance.default,
    backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
    boxShadow: `0 0 0 1px ${fr.colors.decisions.border.actionHigh.blueFrance.default}`,
  },
  cardInactive: {
    opacity: 0.6,
    '&:hover': {
      opacity: 0.8,
    },
  },
  cardIcon: {
    color: fr.colors.decisions.text.actionHigh.blueFrance.default,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    margin: 0,
    fontSize: '1.1rem',
    fontWeight: 700,
    color: fr.colors.decisions.text.title.grey.default,
    marginBottom: fr.spacing('1w'),
  },
  cardDescription: {
    margin: 0,
    fontSize: '0.875rem',
    color: fr.colors.decisions.text.default.grey.default,
    lineHeight: 1.5,
  },
  selectedBadge: {
    position: 'absolute',
    top: fr.spacing('2w'),
    right: fr.spacing('2w'),
    color: fr.colors.decisions.text.actionHigh.blueFrance.default,
  },
}))
