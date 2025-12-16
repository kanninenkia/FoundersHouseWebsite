/**
 * Effects Module
 * Visual effects: fog, city lights, stars, and atmospheric effects
 */

export {
  setupSceneFog,
  updateFogColor
} from './fogManager'

export {
  createLightSprite,
  addCityLights,
  addCityLightsPoints,
  animateCityLights,
  updateCityLightsFog,
  removeCityLights
} from './cityLights'

export {
  createStarfield,
  animateStars
} from './stars'
