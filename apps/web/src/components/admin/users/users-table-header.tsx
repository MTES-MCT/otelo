'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'
import Input from '@codegouvfr/react-dsfr/Input'
import { useQueryClient } from '@tanstack/react-query'
import { useQueryState } from 'nuqs'
import { FC, useCallback, useEffect, useState } from 'react'
import { tss } from 'tss-react'
import { useSearchUsers } from '~/hooks/use-search-users'
import { useSynchroDs } from '~/hooks/use-synchro-ds'
import { useUsers } from '~/hooks/use-users'

export const UsersTableHeader: FC = () => {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useQueryState('q')
  const [inputValue, setInputValue] = useState(searchQuery ?? '')
  const { data: usersResponse } = useUsers()
  const { data: usersSearchResponse } = useSearchUsers()
  const { mutate, isPending } = useSynchroDs()

  const { classes, cx } = useStyles()

  useEffect(() => {
    const handler = setTimeout(() => {
      if (inputValue.length === 0) {
        setSearchQuery(null)
      } else if (inputValue.length >= 3) {
        setSearchQuery(inputValue)
      }
    }, 150)

    return () => clearTimeout(handler)
  }, [inputValue, setSearchQuery])

  const handleSynchroDs = async () => {
    await mutate()
    setSearchQuery(null)
    queryClient.invalidateQueries({ queryKey: ['users'] })
  }

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }, [])

  const userCount = searchQuery ? usersSearchResponse?.userCount : usersResponse?.userCount

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
      <Button onClick={handleSynchroDs} disabled={isPending}>
        {isPending ? 'Synchronisation en cours...' : 'Synchronisation Démarches Simplifiées'}
      </Button>
    </div>
  )
}

const useStyles = tss.create({
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
    justifyContent: 'center',
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
