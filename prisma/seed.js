const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = [
    'Gate 9',
    'D',
    '2ab',
    'F',
    'G',
    'PU',
    'I',
    'B3',
    'Loading',
  ];

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const sampleTasks = [
    { content: 'Check foundation', category: 'Gate 9' },
    { content: 'Verify wiring', category: 'D' },
    { content: 'Install panels', category: '2ab' },
    { content: 'Paint walls', category: 'F' },
    { content: 'Safety inspection', category: 'G' },
    { content: 'Plumbing check', category: 'PU' },
    { content: 'Inventory count', category: 'I' },
    { content: 'Waste management', category: 'B3' },
    { content: 'Truck arrival', category: 'Loading' },
  ];

  for (const sample of sampleTasks) {
    const cat = await prisma.category.findUnique({ where: { name: sample.category } });
    if (cat) {
      await prisma.task.create({
        data: {
          content: sample.content,
          categoryId: cat.id,
        },
      });
    }
  }

  console.log('Seed completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
