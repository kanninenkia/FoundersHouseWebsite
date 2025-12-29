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
  addCityLightsPoints,
  animateCityLights,
  updateCityLightsFog,
  removeCityLights,
  disposeCachedLightSprite
} from './cityLights'

export {
  createStarfield,
  animateStars
} from './stars'
