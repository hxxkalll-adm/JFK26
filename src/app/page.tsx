import { prisma } from '@/lib/prisma';
import HomeClient from './HomeClient';

export default async function Home() {
  const categories = await prisma.category.findMany({
    include: {
      tasks: {
        orderBy: [
          { id: 'asc' },
        ],
      },
    },
    orderBy: {
      id: 'asc',
    },
  });

  return <HomeClient initialCategories={categories} />;
}
