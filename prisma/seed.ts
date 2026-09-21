import { characters, creators, scenes, tags, worlds } from "../src/data/catalog";

async function main() {
  console.log("KATHA seed preview (M1 uses src/data/catalog.ts directly).");
  console.log({
    creators: creators.length,
    tags: tags.length,
    characters: characters.length,
    scenes: scenes.length,
    worlds: worlds.length,
  });
}

main();
