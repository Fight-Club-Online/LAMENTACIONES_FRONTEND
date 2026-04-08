export type UserCharacter = {
    id: string;          
    user: string;
    character: Character;
  };

/** Flat character shape returned directly by the lobby API */
export type ApiUserCharacter = {
  id?: string;
  user?: string;
  characterId: number;
  characterLevel: number;
  characterName: string;
  characterHp: string;
  characterATK: string;
  characterDEF: string;
  characterImg?: string;
};


  export type Character = {
    characterId: number;
    characterLevel: number;
    characterName: string;
    characterHp: string;
    characterATK: string;
    characterDEF: string;
    characterImg: string;
  };  