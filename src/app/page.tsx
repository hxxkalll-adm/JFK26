import { prisma } from '@/lib/prisma';
import HomeClient from './HomeClient';

export const dynamic = 'force-dynamic';

export default async function Home() {
  let categories: any[] = [];
  try {
    categories = await prisma.category.findMany({
      include: {
        tasks: {
          orderBy: [
            { section: 'asc' },
            { position: 'asc' },
          ],
        },
      },
      orderBy: {
        id: 'asc',
      },
    });
  } catch (error) {
    console.error("Database fetch failed:", error);
    // Return empty array or some fallback data
  }

  return <HomeClient initialCategories={categories} />;
}
