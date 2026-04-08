export type UserCharacter = {
    id: string;          
    user: string;
    character: Character;
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