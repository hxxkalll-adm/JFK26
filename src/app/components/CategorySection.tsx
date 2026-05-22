import { Category, Task } from '@prisma/client';
import { TaskItem } from './TaskItem';

interface CategorySectionProps {
  category: Category & { tasks: Task[] };
}

export function CategorySection({ category }: CategorySectionProps) {
  const completedCount = category.tasks.filter((t) => t.completed).length;
  const totalCount = category.tasks.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end mb-2">
        <h2 className="text-lg font-bold text-slate-800">{category.name}</h2>
        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
          {completedCount}/{totalCount} Selesai
        </span>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-1.5 rounded-full mb-4 overflow-hidden">
        <div 
          className="bg-indigo-500 h-full transition-all duration-700 ease-out" 
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-2">
        {category.tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
        {category.tasks.length === 0 && (
          <p className="text-sm text-slate-400 italic py-2">Belum ada tugas di kategori ini</p>
        )}
      </div>
    </section>
  );
}
