'use client'

import { useEffect, useRef } from 'react'
import { RateSettings, useEpcisRates } from '~/app/(authenticated)/simulation/(creation)/(rates-provider)/rates-provider'

/** Réduction du taux de vacance de longue durée proposée par défaut, en pourcentage. */
export const DEFAULT_LONG_TERM_VACANCY_REDUCTION_PERCENT = 15

export const applyLongTermVacancyReduction = (defaultRate: number, reductionPercent: number) =>
  defaultRate - (reductionPercent / 100) * defaultRate

/**
 * Applique la réduction par défaut à tous les EPCI du périmètre, une seule fois chacun.
 *
 * Ce défaut vit ici, au-dessus des onglets, et non dans le champ qui l'affiche : le panneau d'onglet
 * n'est monté que pour l'EPCI visible, si bien qu'un EPCI jamais ouvert partirait en simulation avec
 * son taux brut — un écart silencieux sur le résultat, pas seulement sur l'affichage.
 *
 * Le registre des EPCI déjà initialisés doit survivre au montage des panneaux : sans lui, revenir sur
 * un onglet réécraserait la valeur saisie par l'utilisateur.
 */
export const useDefaultLongTermVacancyReduction = () => {
  const { defaultRates, updateAllRates } = useEpcisRates()
  const initializedEpcis = useRef(new Set<string>())

  useEffect(() => {
    const pending = Object.keys(defaultRates).filter((epciCode) => !initializedEpcis.current.has(epciCode))
    if (pending.length === 0) return

    const updates: Record<string, Partial<RateSettings>> = {}
    pending.forEach((epciCode) => {
      const defaultRate = defaultRates[epciCode]?.longTermVacancyRate
      if (defaultRate === undefined) return
      initializedEpcis.current.add(epciCode)
      updates[epciCode] = {
        longTermVacancyRate: applyLongTermVacancyReduction(defaultRate, DEFAULT_LONG_TERM_VACANCY_REDUCTION_PERCENT),
      }
    })

    if (Object.keys(updates).length > 0) {
      updateAllRates(updates)
    }
  }, [defaultRates, updateAllRates])
}
