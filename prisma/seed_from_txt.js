const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const dataPath = path.join(process.cwd(), 'data.txt');
  const content = fs.readFileSync(dataPath, 'utf8');

  // Clear existing data to start fresh
  console.log('Clearing existing data...');
  await prisma.task.deleteMany({});
  await prisma.category.deleteMany({});

  // Split content by categories
  // Looking for "Category Name :" or "# Category Name"
  const sections = content.split(/\n(?=(?:[\w\s#.]+ :|# [\w\s#.]+))/);

  const supportSubCategories = ['Media Center', 'Promosi & DGM', 'Safety', 'HRD Jateng'];
  const supportMainCategoryName = 'Support Office Department';
  
  const gatePUSubCategories = ['Gate 1 konser', 'Gate VIP konser', 'Gate 2 konser', 'PU Tribun'];
  const gatePUMainCategoryName = 'Gate PU';

  // Create Main Categories first
  const supportMainCategory = await prisma.category.create({
    data: { name: supportMainCategoryName },
  });
  
  const gatePUMainCategory = await prisma.category.create({
    data: { name: gatePUMainCategoryName },
  });

  for (const section of sections) {
    const lines = section.trim().split('\n');
    if (lines.length === 0) continue;

    let originalCategoryName = lines[0].replace(':', '').trim();
    if (originalCategoryName.startsWith('# ')) {
      originalCategoryName = originalCategoryName.substring(2);
    }

    if (!originalCategoryName) continue;
    if (originalCategoryName === 'Support Office Departemen') continue; // Skip header

    const isSupportSub = supportSubCategories.some(sub => 
      originalCategoryName.toLowerCase().includes(sub.toLowerCase())
    );
    
    const isGatePUSub = gatePUSubCategories.some(sub =>
      originalCategoryName.toLowerCase().includes(sub.toLowerCase())
    );

    let category;

    if (isSupportSub) {
      console.log(`Grouping ${originalCategoryName} under ${supportMainCategoryName}`);
      category = supportMainCategory;
    } else if (isGatePUSub) {
      console.log(`Grouping ${originalCategoryName} under ${gatePUMainCategoryName}`);
      category = gatePUMainCategory;
    } else {
      console.log(`Processing category: ${originalCategoryName}`);
      category = await prisma.category.upsert({
        where: { name: originalCategoryName },
        update: {},
        create: { name: originalCategoryName },
      });
    }

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line.startsWith('- [')) continue;

      const isCompleted = line.startsWith('- [x]');
      const taskContent = line.substring(5).trim();

      if (!taskContent) continue;

      // Determine default section
      let taskSection = "A. Gate";
      if (isSupportSub || isGatePUSub) {
        taskSection = originalCategoryName;
      } else {
        if (taskContent.toLowerCase().includes('cctv')) {
          taskSection = "CCTV Monitoring";
        } else if (taskContent.toLowerCase().includes('switch') || taskContent.toLowerCase().includes('uplink') || taskContent.toLowerCase().includes('wifi') || taskContent.toLowerCase().includes('access point')) {
          taskSection = "Network Infrastructure";
        }
      }

      await prisma.task.create({
        data: {
          content: taskContent,
          completed: isCompleted,
          categoryId: category.id,
          section: taskSection,
        },
      });
    }
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
