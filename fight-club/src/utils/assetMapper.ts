import type { CharacterAssets } from '../modules/Lobby/Config/axiosLobby';

/**
 * Convierte el nombre del personaje en un objeto CharacterAssets
 * usando las imágenes locales de la carpeta FighterAssets
 * 
 * Los assets deben estar en: src/assets/FighterAssets/{characterName}/
 * Estructura esperada:
 *   samurai_IDLE.png
 *   samurai_RUN.png
 *   samurai_ATTACK.png
 *   samurai_HURT.png
 */
export const getLocalCharacterAssets = (characterName: string): CharacterAssets => {
  const normalizedName = characterName.toLowerCase().trim();
  const basePath = `/src/assets/FighterAssets/${normalizedName}`;

  return {
    idle_url: `${basePath}/${normalizedName}_IDLE.png`,
    run_url: `${basePath}/${normalizedName}_RUN.png`,
    attack_url: `${basePath}/${normalizedName}_ATTACK.png`,
    hurt_url: `${basePath}/${normalizedName}_HURT.png`,
  };
};
