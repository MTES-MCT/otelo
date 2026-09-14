/**
 * Fond de plan Plan IGN, partagé par les trois cartes de l'application.
 *
 * Les tuiles raster CARTO (`light_all`, `voyager`) sont gravées avec les libellés OSM `name:en` et
 * n'offrent aucun paramètre de langue : on y lisait « Island of France » ou « Burgundy Free County ».
 * Le Plan IGN est en français, servi par la Géoplateforme sans clé d'API, et son style `gris` reste
 * assez neutre pour passer sous les aplats GeoJSON.
 *
 * C'est un style vectoriel : il se rend via maplibre-gl, branché sur Leaflet par
 * `IgnBasemapLayer`. Les autres variantes disponibles sur le même chemin sont `attenue`, `epure`,
 * `standard`, `classique` et `sans_toponymes`.
 */
export const IGN_STYLE_URL = 'https://data.geopf.fr/annexes/ressources/vectorTiles/styles/PLAN.IGN/gris.json'

/** Le TileJSON de la Géoplateforme ne porte pas d'attribution : on la fournit explicitement. */
export const IGN_ATTRIBUTION =
  '&copy; <a href="https://www.ign.fr/">IGN</a> &mdash; <a href="https://geoservices.ign.fr/">Géoplateforme</a>'
