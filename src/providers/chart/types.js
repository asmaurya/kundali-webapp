/**
 * ChartProvider contract (provider-neutral).
 *
 * Implementations must return the canonical chart shape used by the app
 * (see docs/ARCHITECTURE.md §5.3). UI and storage never import a concrete
 * ephemeris library — only this interface via getChartProvider().
 *
 * @typedef {object} BirthInput
 * @property {string} date
 * @property {string} time
 * @property {string} place
 * @property {number} [lat]
 * @property {number} [lon]
 * @property {number} [tzOffsetHours]
 *
 * @typedef {object} ChartProvider
 * @property {string} id
 * @property {(birth: BirthInput) => Promise<object>|object} computeNatal
 * @property {() => Promise<{ok:boolean,detail?:string}>} [health]
 */

export const CHART_PROVIDER_IDS = {
  localAstronomy: 'local-astronomy-engine',
  remoteApi: 'remote-chart-api',
  hybrid: 'hybrid-swiss-fallback',
};
