export interface GameEntry {
  id: string;
  titleKey: string;        // i18next key, e.g. "games.memory.title"
  descriptionKey: string;  // i18next key
  path: string;             // route path
  icon?: string;             // optional icon name/emoji
}

export const GAME_REGISTRY: GameEntry[] = [
  {
    id: "memory",
    titleKey: "memory.title",
    descriptionKey: "memory.description",
    path: "/games/memory",
    icon: "🧠",
  },
  // add new games here as they're built
];