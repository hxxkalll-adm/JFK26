import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        tasks: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        id: 'asc',
      },
    });
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
