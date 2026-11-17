import { BadRequestException } from '@nestjs/common'
import { Role } from '~/generated/prisma/enums'
import { assertTerritoryAllowed, ILE_DE_FRANCE_EPCI_CODES, isIleDeFranceEpci } from './ile-de-france'

const METROPOLE_GRAND_PARIS = '200054781'
const GRAND_PERIGUEUX = '200040392'

describe('Île-de-France', () => {
  it('recense les 52 EPCI franciliens', () => {
    expect(ILE_DE_FRANCE_EPCI_CODES.size).toBe(52)
    expect(isIleDeFranceEpci(METROPOLE_GRAND_PARIS)).toBe(true)
    expect(isIleDeFranceEpci(GRAND_PERIGUEUX)).toBe(false)
  })

  describe('assertTerritoryAllowed', () => {
    it('refuse un territoire comprenant un EPCI francilien à un utilisateur', () => {
      expect(() => assertTerritoryAllowed([GRAND_PERIGUEUX, METROPOLE_GRAND_PARIS], Role.USER)).toThrow(BadRequestException)
    })

    it("refuse un territoire francilien sans rôle (consommateur de l'API externe)", () => {
      expect(() => assertTerritoryAllowed([METROPOLE_GRAND_PARIS])).toThrow(BadRequestException)
    })

    it('autorise un territoire francilien à un administrateur', () => {
      expect(() => assertTerritoryAllowed([METROPOLE_GRAND_PARIS], Role.ADMIN)).not.toThrow()
    })

    it('autorise un territoire hors Île-de-France', () => {
      expect(() => assertTerritoryAllowed([GRAND_PERIGUEUX], Role.USER)).not.toThrow()
    })
  })
})
