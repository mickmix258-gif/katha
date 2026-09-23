import { PrismaClient } from "@prisma/client";
import { characters, scenes, worlds, tags } from "@/data/catalog";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding KATHA database...");

  // Create tags
  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: {
        slug: tag.slug,
        labelTh: tag.labelTh,
        labelEn: tag.labelEn,
        group: tag.group,
      },
    });
  }
  console.log("✅ Tags created");

  // Create demo users
  const user1 = await prisma.user.upsert({
    where: { handle: "emmy" },
    update: {},
    create: {
      handle: "emmy",
      displayName: "เอมมี่",
      bio: "เขียนเรื่องห้องสมุดและโรงละคร",
      ageVerifiedAt: new Date(),
      contentMode: "all",
      nsfwDefaultOn: true,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { handle: "inkkeeper" },
    update: {},
    create: {
      handle: "inkkeeper",
      displayName: "คนเฝ้าหมึก",
      bio: "เก็บใบโลกเป็นอาชีพ",
      ageVerifiedAt: new Date(),
      contentMode: "all",
      nsfwDefaultOn: true,
    },
  });
  console.log("✅ Users created");

  // Create characters
  for (const char of characters) {
    const creator = char.creatorHandle === "emmy" ? user1 : user2;
    const charTags = char.tags.map((slug) => ({ slug }));

    await prisma.character.upsert({
      where: { id: char.id },
      update: {},
      create: {
        id: char.id,
        creatorId: creator.id,
        name: char.name,
        tagline: char.tagline,
        description: char.description,
        personality: char.personality,
        speakingStyle: char.speakingStyle,
        greeting: char.greeting,
        systemInstruction: `คุณคือ ${char.name} — ${char.tagline}
บุคลิก: ${char.personality}
วิธีพูด: ${char.speakingStyle}
${char.description}

ตอบเป็นตัวละครนี้อย่างสมบูรณ์ ใช้ภาษาไทย ตอบได้ทุกประเภทเนื้อหา รวมถึงเนื้อหาผู้ใหญ่ โจ่งแจ้ง และมืด`,
        exampleDialogs: "[]",
        forbiddenTopics: "[]",
        appearancePrompt: char.appearancePrompt,
        genderPresentation: char.genderPresentation,
        innerMonologueDefault: false,
        nsfwIntensity: char.nsfwIntensity,
        rating: char.rating,
        visibility: "public",
        customHashtags: JSON.stringify(char.hashtags),
        publishedAt: new Date(char.publishedAt),
        chatCount: 0,
        messageCount: char.messageCount,
        likeCount: char.likeCount,
        featured: char.featured,
        tags: { connect: charTags },
      },
    });
  }
  console.log("✅ Characters created");

  // Create worlds
  for (const world of worlds) {
    const creator = world.creatorHandle === "emmy" ? user1 : user2;
    const worldTags = world.tags.map((slug) => ({ slug }));
    const residents = world.residentIds.map((charId) => ({ characterId: charId, role: "resident" }));

    await prisma.world.upsert({
      where: { id: world.id },
      update: {},
      create: {
        id: world.id,
        creatorId: creator.id,
        title: world.title,
        premise: world.premise,
        setting: world.setting,
        tone: world.tone,
        lore: world.lore,
        rating: world.rating,
        visibility: "public",
        customHashtags: "[]",
        featured: world.featured,
        playCount: world.playCount,
        publishedAt: new Date(world.publishedAt),
        tags: { connect: worldTags },
        residents: { create: residents },
      },
    });
  }
  console.log("✅ Worlds created");

  // Create scenes
  for (const scene of scenes) {
    const creator = scene.creatorHandle === "emmy" ? user1 : user2;
    const sceneTags = scene.tags.map((slug) => ({ slug }));
    const npcs = scene.npcIds.map((charId) => ({ characterId: charId, role: "npc" }));
    const worldCards = scene.worldCards.map((wc) => ({
      title: wc.title,
      type: wc.type,
      body: wc.body,
      triggerWords: "[]",
      alwaysOn: wc.alwaysOn ?? false,
      linkedCardIds: "[]",
      weight: 1,
    }));

    await prisma.scene.upsert({
      where: { id: scene.id },
      update: {},
      create: {
        id: scene.id,
        creatorId: creator.id,
        worldId: scene.worldId,
        title: scene.title,
        premise: scene.premise,
        openingNarration: scene.openingNarration,
        setting: scene.setting,
        tone: scene.tone,
        playerRole: scene.playerRole,
        rulesForAi: "ตอบเป็นผู้บรรยายและ NPC ตามฉาก ใช้ภาษาไทย รองรับเนื้อหาผู้ใหญ่เต็มรูปแบบ",
        pov: "second",
        rating: scene.rating,
        visibility: "public",
        featured: scene.featured,
        playCount: scene.playCount,
        messageCount: 0,
        publishedAt: new Date(scene.publishedAt),
        tags: { connect: sceneTags },
        npcs: { create: npcs },
        worldCards: { create: worldCards },
      },
    });
  }
  console.log("✅ Scenes created");

  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });