import app from '../../app.json';

// react-native-maps utilise Google Maps sur Android et EXIGE une clé API dans
// le manifeste (com.google.android.geo.API_KEY). Sans clé, rendre un <MapView>
// fait planter l'app nativement (impossible à rattraper en JS). On lit donc la
// même clé que le manifeste (app.json -> android.config.googleMaps.apiKey) :
// tant qu'elle est vide, on n'affiche pas de carte mais un repli en liste.
// Quand la clé est renseignée puis l'app rebuildée, la carte s'active seule.
export const MAPS_API_KEY: string =
  (app as any)?.expo?.android?.config?.googleMaps?.apiKey?.trim?.() || '';

export const MAPS_ENABLED = MAPS_API_KEY.length > 0;
