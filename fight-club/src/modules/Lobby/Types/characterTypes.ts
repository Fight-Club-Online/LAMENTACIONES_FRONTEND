/**
 * UserCharacter - Estructura que retorna el backend (plana)
 * Refleja la clase Java: UserCharacter
 */
export type UserCharacter = {
  _id?: string;
  userId: string;
  characterId: string | number;  // Identificador del personaje
  characterName: string;
  characterLevel: number | string;
  characterHp: number | string;
  characterATK: number | string;
  characterDEF: number | string;
  

  assets?: CharacterAssets;
  characterImg?: string;
  
  character?: Character;
  
  _class?: string;
};

/**
 * Character - Estructura base de personaje (usado en getAllCharacters)
 */
export type Character = {
  characterId: number | string;
  characterLevel: number | string;
  characterName: string;
  characterHp: string | number;
  characterATK: string | number;
  characterDEF: string | number;
  characterImg?: string;
};

/**
 * CharacterAssets - Estructura de assets del personaje
 */
export type CharacterAssets = {
  characterId?: string;
  idle_url?: string;
  run_url?: string;
  attack_url?: string;
  hurt_url?: string;
  [key: string]: any;
};