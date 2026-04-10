import type { UserCharacter, Character, CharacterAssets } from './characterTypes';

/**
 * Helpers para acceder a propiedades de UserCharacter
 */
export function getCharacterId(char: UserCharacter | null | undefined): string | number {
  if (!char) return '';
  // Estructura nueva (plana)
  if (char.characterId) return char.characterId;
  // Estructura vieja (anidada)
  if (char.character?.characterId) return char.character.characterId;
  return '';
}

/**
 * Obtiene el nombre del personaje
 */
export function getCharacterName(char: UserCharacter | null | undefined): string {
  if (!char) return '';
  if (char.characterName) return char.characterName;
  if (char.character?.characterName) return char.character.characterName;
  return '';
}

/**
 * Obtiene el nivel del personaje
 */
export function getCharacterLevel(char: UserCharacter | null | undefined): number | string {
  if (!char) return 0;
  if (char.characterLevel || char.characterLevel === 0) return char.characterLevel;
  if (char.character?.characterLevel || char.character?.characterLevel === 0) return char.character.characterLevel;
  return 0;
}

/**
 * Obtiene la vida del personaje
 */
export function getCharacterHp(char: UserCharacter | null | undefined): number | string {
  if (!char) return 0;
  if (char.characterHp || char.characterHp === 0) return char.characterHp;
  if (char.character?.characterHp || char.character?.characterHp === 0) return char.character.characterHp;
  return 0;
}

/**
 * Obtiene el ataque del personaje
 */
export function getCharacterATK(char: UserCharacter | null | undefined): number | string {
  if (!char) return 0;
  if (char.characterATK || char.characterATK === 0) return char.characterATK;
  if (char.character?.characterATK || char.character?.characterATK === 0) return char.character.characterATK;
  return 0;
}

/**
 * Obtiene la defensa del personaje
 */
export function getCharacterDEF(char: UserCharacter | null | undefined): number | string {
  if (!char) return 0;
  if (char.characterDEF || char.characterDEF === 0) return char.characterDEF;
  if (char.character?.characterDEF || char.character?.characterDEF === 0) return char.character.characterDEF;
  return 0;
}

/**
 * Obtiene la imagen del personaje
 */
export function getCharacterImg(char: UserCharacter | null | undefined): string | undefined {
  if (!char) return undefined;
  if (char.characterImg) return char.characterImg;
  if (char.character?.characterImg) return char.character.characterImg;
  return undefined;
}

/**
 * Normaliza un UserCharacter a la estructura plana nueva
 * Si ya está plano, lo devuelve igual
 * Si está anidado, lo convierte
 */
export function normalizeUserCharacter(char: UserCharacter): UserCharacter {
  return {
    userId: char.userId || '',
    characterId: getCharacterId(char),
    characterName: getCharacterName(char),
    characterLevel: getCharacterLevel(char),
    characterHp: getCharacterHp(char),
    characterATK: getCharacterATK(char),
    characterDEF: getCharacterDEF(char),
    // Preservar datos opcionales
    characterImg: getCharacterImg(char),
    assets: char.assets,
  };
}

/**
 * Convierte UserCharacter a Character 
 */
export function userCharacterToCharacter(char: UserCharacter): Character {
  return {
    characterId: getCharacterId(char),
    characterLevel: getCharacterLevel(char),
    characterName: getCharacterName(char),
    characterHp: getCharacterHp(char),
    characterATK: getCharacterATK(char),
    characterDEF: getCharacterDEF(char),
    characterImg: getCharacterImg(char),
  };
}

/**
 * Crea un UserCharacter desde un Character
 */
export function characterToUserCharacter(
  char: Character,
  userId: string,
  assets?: CharacterAssets
): UserCharacter {
  return {
    userId,
    characterId: char.characterId,
    characterName: char.characterName,
    characterLevel: char.characterLevel,
    characterHp: char.characterHp,
    characterATK: char.characterATK,
    characterDEF: char.characterDEF,
    characterImg: char.characterImg,
    assets,
  };
}
