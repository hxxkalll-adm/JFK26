'use client';

import { Task } from '@prisma/client';
import { toggleTask } from '../actions';
import { useState, useTransition } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

interface TaskItemProps {
  task: Task;
}

export function TaskItem({ task }: TaskItemProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticCompleted, setOptimisticCompleted] = useState(task.completed);

  const handleToggle = () => {
    const nextState = !optimisticCompleted;
    setOptimisticCompleted(nextState);
    startTransition(async () => {
      try {
        await toggleTask(task.id, nextState);
      } catch (error) {
        // Revert on error
        setOptimisticCompleted(!nextState);
        console.error('Failed to toggle task:', error);
      }
    });
  };

  return (
    <div 
      onClick={handleToggle}
      className={`flex items-center p-3 rounded-xl border transition-all cursor-pointer select-none active:scale-[0.98] ${
        optimisticCompleted 
          ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
          : 'bg-white border-slate-100 text-slate-700 hover:border-slate-200'
      } ${isPending ? 'opacity-70' : 'opacity-100'}`}
    >
      <div className="mr-3">
        {optimisticCompleted ? (
          <CheckCircle2 className="text-emerald-500" size={22} />
        ) : (
          <Circle className="text-slate-300" size={22} />
        )}
      </div>
      <span className={`text-sm font-medium ${optimisticCompleted ? 'line-through opacity-60' : ''}`}>
        {task.content}
      </span>
    </div>
  );
}
