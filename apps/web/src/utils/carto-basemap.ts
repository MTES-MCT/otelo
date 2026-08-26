/**
 * Fond de plan CARTO, partagé par les trois cartes de l'application.
 *
 * CARTO exige désormais une clé sur `basemaps.cartocdn.com` : sans elle, les tuiles sont servies en
 * HTTP 200 mais tatouées « API KEY REQUIRED ». La clé est publique par conception — elle part dans
 * le bundle client — et se restreint par domaine depuis la console CARTO.
 *
 * `NEXT_PUBLIC_*` est inliné AU BUILD : poser la variable sur la plateforme ne suffit pas, il faut
 * redéployer. Sans clé, on garde l'URL nue plutôt que d'envoyer `key=undefined` : les tuiles restent
 * tatouées, mais la carte s'affiche.
 */
const CARTO_KEY = process.env.NEXT_PUBLIC_CARTO_KEY

export const CARTO_ATTRIBUTION = '&copy; <a href="https://carto.com/">CARTO</a>'

export const CARTO_TILE_URL = `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png${CARTO_KEY ? `?key=${CARTO_KEY}` : ''}`
