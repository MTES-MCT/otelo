'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'
import Input from '@codegouvfr/react-dsfr/Input'
import { useQueryClient } from '@tanstack/react-query'
import { FC, useCallback, useEffect, useRef, useState } from 'react'
import { tss } from 'tss-react'
import { useCsvExport } from '~/hooks/use-csv-export'
import { useImportCsvUsers } from '~/hooks/use-import-csv-users'
import { useSynchroDs } from '~/hooks/use-synchro-ds'

interface UsersTableHeaderProps {
  userCount: number
  searchQuery: string
  onSearchQueryChange: (q: string) => void
}

export const UsersTableHeader: FC<UsersTableHeaderProps> = ({ userCount, searchQuery, onSearchQueryChange }) => {
  const queryClient = useQueryClient()
  const [inputValue, setInputValue] = useState(searchQuery ?? '')
  const { mutate, isPending } = useSynchroDs()
  const { exportCsv, isPending: isExporting } = useCsvExport('/api/users/export/csv', 'export-utilisateurs.csv')
  const { mutateAsync: importCsv, isPending: isImporting } = useImportCsvUsers()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { classes, cx } = useStyles()

  useEffect(() => {
    const handler = setTimeout(() => {
      if (inputValue.length === 0) {
        onSearchQueryChange('')
      } else if (inputValue.length >= 3) {
        onSearchQueryChange(inputValue)
      }
    }, 150)

    return () => clearTimeout(handler)
  }, [inputValue, onSearchQueryChange])

  const handleSynchroDs = async () => {
    await mutate()
    onSearchQueryChange('')
    queryClient.invalidateQueries({ queryKey: ['users'] })
  }

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }, [])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    await importCsv(file)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={classes.container}>
      <div className={classes.searchContainer}>
        <Input
          label="Rechercher un utilisateur"
          hideLabel
          nativeInputProps={{
            onChange: handleInputChange,
            placeholder: 'Rechercher un utilisateur (min. 3 caractères)',
            value: inputValue,
          }}
          className={classes.searchInput}
        />
        <div className={classes.usersCountContainer}>
          <div className={classes.iconWrapper}>
            <span className={cx(classes.userIcon, fr.cx('fr-icon-user-fill'))}></span>
          </div>
          <span className={classes.userCount}>{userCount} utilisateurs</span>
        </div>
      </div>
      <div className={classes.actionsContainer}>
        <a href="/assets/csv/template_import_utilisateurs.csv" download className={classes.templateLink}>
          Template CSV
        </a>
        <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} style={{ display: 'none' }} />
        <Button priority="secondary" onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
          {isImporting ? 'Import en cours...' : 'Importer CSV'}
        </Button>
        <Button priority="secondary" onClick={() => exportCsv({})} disabled={isExporting}>
          {isExporting ? 'Export en cours...' : 'Exporter CSV'}
        </Button>
        <Button onClick={handleSynchroDs} disabled={isPending}>
          {isPending ? 'Synchronisation en cours...' : 'Synchronisation Démarches Simplifiées'}
        </Button>
      </div>
    </div>
  )
}

const useStyles = tss.create({
  actionsContainer: {
    alignItems: 'center',
    display: 'flex',
    gap: '1rem',
  },
  templateLink: {
    color: fr.colors.decisions.text.actionHigh.blueFrance.default,
    fontSize: '0.875rem',
  },
  container: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
  },
  iconWrapper: {
    alignItems: 'center',
    background: fr.colors.decisions.artwork.decorative.blueEcume.default,
    borderRadius: '25%',
    display: 'flex',
    justifyContent: 'center',
    width: '2rem',
  },
  searchContainer: {
    alignItems: 'center',
    display: 'flex',
    gap: '1rem',
  },
  searchInput: {
    marginBottom: '0.5rem !important',
    width: '370px',
  },
  userCount: {
    color: fr.colors.decisions.text.actionHigh.blueFrance.default,
    fontWeight: 'bold',
  },
  userIcon: {
    '&::before': {
      '--icon-size': '1rem',
    },
    color: fr.colors.decisions.text.actionHigh.blueFrance.default,
  },
  usersCountContainer: {
    alignItems: 'center',
    border: `2px solid ${fr.colors.decisions.artwork.decorative.blueEcume.default}`,
    borderRadius: '1rem',
    display: 'flex',
    gap: '1rem',
    paddingBottom: '0.5rem',
    paddingLeft: '1rem',
    paddingRight: '1rem',
    paddingTop: '0.5rem',
  },
})
