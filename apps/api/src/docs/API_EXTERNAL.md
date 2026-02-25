# API Externe Otelo

## Swagger UI

Documentation interactive disponible : `https://otelo-api.osc-fr1.scalingo.io/api/swagger-external`

## Authentification

Toutes les requêtes vers `/api/external/` doivent inclure un header `Authorization` avec un Bearer token :

```
Authorization: Bearer otelo_a1b2c3d4...
```

## Endpoints

### Créer une simulation

```
POST /api/external/simulations
```

**Body :**

```json
{
  "name": "Ma simulation DREAL",
  "epci": [
    { "code": "200093201" }
  ],
  "scenario": {
    "b2_scenario": "central",
    "projection": 2030,
    "epcis": {
      "200093201": {
        "b2_tx_rs": 0.0,
        "b2_tx_vacance": 0.0,
        "b2_tx_vacance_longue": 0.0,
        "b2_tx_vacance_courte": 0.0,
        "b2_tx_restructuration": 0.0,
        "b2_tx_disparition": 0.0,
        "baseEpci": true
      }
    }
  },
  "epciGroupName": "Groupe IDF"
}
```

**Reponse :** Simulation complète avec résultats (besoins stock B1 + flux B2 + totaux).

### Mettre à jour le scénario

```
PUT /api/external/simulations/:simulationId/scenario
```

Met à jour les paramètres du scénario et recalcule les résultats. 

### Obtenir les re2sultats

```
GET /api/external/simulations/:simulationId/results
```

### Lister ses simulations

```
GET /api/external/simulations
```

### Supprimer une simulation

```
DELETE /api/external/simulations/:simulationId
```

## Contexte de calcul

- Quand un `simulationId` est present dans l'URL, le calcul utilise toujours le millesime et les parametres de cette simulation.
- Quand aucun `simulationId` n'est disponible, le calcul utilise le data pack actif (`data_pack_versions.is_active = true`).

## Exemples

### curl

```bash
# Creer une simulation
curl -X POST https://otelo-api.osc-fr1.scalingo.io/api/external/simulations \
  -H "Authorization: Bearer otelo_a1b2c3d4..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test macro",
    "epci": [{"code": "200093201"}],
    "scenario": {
      "b2_scenario": "central",
      "projection": 2030,
      "epcis": {
        "200093201": {
          "b2_tx_rs": 0.0,
          "b2_tx_vacance": 0.0,
          "b2_tx_vacance_longue": 0.0,
          "b2_tx_vacance_courte": 0.0,
          "b2_tx_restructuration": 0.0,
          "b2_tx_disparition": 0.0,
          "baseEpci": true
        }
      }
    }
  }'

# Lister ses simulations
curl https://otelo-api.osc-fr1.scalingo.io/api/external/simulations \
  -H "Authorization: Bearer otelo_a1b2c3d4..."

# Obtenir les résultats
curl https://otelo-api.osc-fr1.scalingo.io/api/external/simulations/[SIM_ID]/results \
  -H "Authorization: Bearer otelo_a1b2c3d4..."
```

## Structure des résultats

Les resultats contiennent :

- **stockRequirementsNeeds** : Besoins stock B1
  - `noAccomodation` : Sans logement (B11)
  - `hosted` : Heberges (B12)
  - `financialInadequation` : Inadequation financiere (B13)
  - `badQuality` : Mauvaise qualite (B14)
  - `physicalInadequation` : Inadequation physique (B15)
- **flowRequirement** : Besoins flux B2 (évolution de2mographique + renouvellement)
- **sitadel** : Donnees Sitadel (autorisations et mises en chantier)
- **epcisTotals** : Totaux par EPCI
- **totals** : Totaux agregés (total, totalStock, totalFlux, vacantAccomodation, secondaryAccommodation)

## Paramètres de scenario

| Parametre | Type | Description |
|---|---|---|
| `b2_scenario` | string | Scenario demographique (`central`, `haute`, `basse`) |
| `projection` | number | Annee de projection (ex: 2030, 2035, 2040) |
| `b1_horizon_resorption` | number | Horizon de resorption (defaut: 2050) |
| `b11_sa` | boolean | Inclure sans-abri (defaut: true) |
| `b11_hotel` | boolean | Inclure hotel (defaut: true) |
| `b13_taux_effort` | number | Taux d'effort seuil (defaut: 30) |
| `b14_confort` | string | Source confort B14 |
| `b14_occupation` | string | Source occupation B14 |

Voir le Swagger UI pour la liste complete des parametres.
