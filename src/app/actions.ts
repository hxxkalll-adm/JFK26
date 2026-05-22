'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function toggleTask(taskId: number, completed: boolean) {
  try {
    await prisma.task.update({
      where: { id: taskId },
      data: { completed },
    });
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error toggling task:', error);
    return { success: false, error: 'Gagal mengubah status tugas' };
  }
}

export async function addTask(categoryId: number, content: string, section: string = "A. Gate") {
  try {
    // Split content by new lines and filter out empty lines
    const lines = content.split('\n').map(l => l.trim()).filter(l => l !== '');
    
    if (lines.length === 0) return { success: false, error: 'Isi tugas tidak boleh kosong' };

    await prisma.$transaction(
      lines.map(line => prisma.task.create({
        data: {
          content: line,
          categoryId,
          section,
        },
      }))
    );

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error adding tasks:', error);
    return { success: false, error: 'Gagal menambah tugas' };
  }
}

export async function updateTaskPositions(updates: { id: number, position: number, section?: string }[]) {
  try {
    await prisma.$transaction(
      updates.map(update => prisma.task.update({
        where: { id: update.id },
        data: { 
          position: update.position,
          ...(update.section && { section: update.section })
        },
      }))
    );
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error updating positions:', error);
    return { success: false, error: 'Gagal memperbarui urutan' };
  }
}

export async function updateSectionPositions(categoryId: number, oldSection: string, newSection: string) {
  try {
    await prisma.task.updateMany({
      where: { categoryId, section: oldSection },
      data: { section: newSection },
    });
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error updating section:', error);
    return { success: false, error: 'Gagal memperbarui nama bagian' };
  }
}

export async function deleteSection(categoryId: number, section: string) {
  try {
    await prisma.task.deleteMany({
      where: { categoryId, section },
    });
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error deleting section:', error);
    return { success: false, error: 'Gagal menghapus bagian' };
  }
}

export async function addCategory(name: string) {
  try {
    await prisma.category.create({
      data: { name },
    });
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error adding category:', error);
    return { success: false, error: 'Gagal menambah kategori' };
  }
}

export async function updateTask(taskId: number, content: string, section?: string) {
  try {
    await prisma.task.update({
      where: { id: taskId },
      data: { 
        content,
        ...(section && { section })
      },
    });
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error updating task:', error);
    return { success: false, error: 'Gagal memperbarui tugas' };
  }
}

export async function updateCategory(categoryId: number, name: string) {
  try {
    await prisma.category.update({
      where: { id: categoryId },
      data: { name },
    });
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error updating category:', error);
    return { success: false, error: 'Gagal memperbarui kategori' };
  }
}

export async function deleteTask(taskId: number) {
  try {
    await prisma.task.delete({
      where: { id: taskId },
    });
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error deleting task:', error);
    return { success: false, error: 'Gagal menghapus tugas' };
  }
}

export async function deleteCategory(categoryId: number) {
  try {
    await prisma.$transaction([
      prisma.task.deleteMany({
        where: { categoryId },
      }),
      prisma.category.delete({
        where: { id: categoryId },
      }),
    ]);
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error deleting category:', error);
    return { success: false, error: 'Gagal menghapus kategori' };
  }
}
