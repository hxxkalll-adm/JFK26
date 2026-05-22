'use client';

import { useState, useOptimistic, useTransition, useMemo, useEffect } from 'react';
import { Settings, CheckCircle2, Circle, LayoutGrid, Plus, Trash2, Edit3, X, Check, Lock, Unlock, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { toggleTask, addTask, addCategory, deleteTask, deleteCategory, updateTask, updateCategory, updateTaskPositions, updateSectionPositions, deleteSection } from './actions';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Task {
  id: number;
  content: string;
  section: string;
  position: number;
  completed: boolean;
  categoryId: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Category {
  id: number;
  name: string;
  tasks: Task[];
}

// Helper for sensors
function useMySensors() {
  return useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
}

// Sortable Task Item
function SortableTask({ task, isManageMode, handleToggle, startEdit, onDeleteTask, editingId, editValue, setEditValue, saveEdit }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: `task-${task.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`group flex items-center p-4 rounded-2xl border transition-all select-none ${
        task.completed 
          ? 'bg-emerald-50/20 border-emerald-100/50' 
          : 'bg-slate-50/50 border-transparent hover:border-slate-200'
      } ${isManageMode ? '' : 'cursor-pointer active:scale-[0.98]'}`}
      onClick={() => !isManageMode && handleToggle(task.id, task.completed)}
    >
      {isManageMode && (
        <div {...attributes} {...listeners} className="mr-3 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500">
          <GripVertical size={16} />
        </div>
      )}
      <div 
        className={`mr-4 transition-transform ${task.completed ? 'text-emerald-500' : 'text-slate-300'}`}
        onClick={(e) => { e.stopPropagation(); handleToggle(task.id, task.completed); }}
      >
        {task.completed ? (
          <CheckCircle2 size={24} fill="currentColor" className="text-emerald-500 fill-emerald-100" />
        ) : (
          <Circle size={24} />
        )}
      </div>
      <div className="flex-1" onClick={() => !isManageMode && handleToggle(task.id, task.completed)}>
        {editingId?.type === 'task' && editingId.id === task.id ? (
          <input 
            autoFocus
            className="w-full bg-transparent border-b border-indigo-200 outline-none font-bold text-sm"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={e => e.key === 'Enter' && saveEdit()}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <>
            <span className={`text-sm font-bold block leading-relaxed ${task.completed ? 'text-emerald-700/60 line-through decoration-emerald-300' : 'text-slate-700'}`}>
              {task.content}
            </span>
            <span className={`text-[10px] font-black uppercase tracking-tight ${task.completed ? 'text-emerald-400' : 'text-slate-300'}`}>
              {task.completed ? 'Selesai' : 'Belum Selesai'}
            </span>
          </>
        )}
      </div>
      {isManageMode && (
        <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); startEdit('task', task.id, task.content); }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg"><Edit3 size={14} /></button>
          <button onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg"><Trash2 size={14} /></button>
        </div>
      )}
    </div>
  );
}

// Sortable Section Component
function SortableSection({ 
  sectionName, 
  tasks, 
  isManageMode, 
  handleToggle, 
  startEdit, 
  onDeleteTask, 
  editingId, 
  editingSectionName,
  editValue, 
  setEditValue, 
  saveEdit, 
  onAddTask, 
  activeTab, 
  updateSectionPositions,
  onTaskReorder,
  isExpanded,
  toggleExpand
}: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: `section-${sectionName}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 40 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  const realTasks = tasks.filter((t: any) => !t.content.includes("--- Section Created ---"));
  const taskSensors = useMySensors();
  const isEditingThisSection = editingId?.type === 'section' && editingSectionName === sectionName;

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100/50 mb-4"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {isManageMode && (
            <div 
              {...attributes} 
              {...listeners} 
              className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 p-1 -ml-1"
            >
              <GripVertical size={20} />
            </div>
          )}
          <div 
            className="flex items-center gap-2 flex-1 min-w-0"
          >
            <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
            {isEditingThisSection ? (
               <input 
                 autoFocus
                 className="bg-transparent border-b-2 border-indigo-500 outline-none font-black text-slate-800 text-[11px] uppercase tracking-[0.2em] w-full"
                 value={editValue}
                 onChange={e => setEditValue(e.target.value)}
                 onBlur={saveEdit}
                 onKeyDown={e => e.key === 'Enter' && saveEdit()}
               />
            ) : (
              <h3 
                onClick={toggleExpand}
                className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 cursor-pointer truncate"
              >
                {sectionName}
              </h3>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1 ml-2">
          {isManageMode && !isEditingThisSection && (
            <>
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  startEdit('section', -1, sectionName);
                }} 
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all relative z-20"
                title="Edit Nama Bagian"
              >
                <Edit3 size={14} />
              </button>
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (confirm(`Hapus seluruh bagian "${sectionName}" dan semua tugas di dalamnya?`)) {
                    deleteSection(activeTab, sectionName);
                  }
                }} 
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all relative z-20"
                title="Hapus Bagian"
              >
                <Trash2 size={14} />
              </button>
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAddTask(activeTab, sectionName);
                }} 
                className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all relative z-20"
                title="Tambah tugas"
              >
                <Plus size={16} strokeWidth={4} />
              </button>
            </>
          )}
          <button 
            type="button"
            onClick={toggleExpand} 
            className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-xl transition-all md:hidden"
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      <div className={`${isExpanded ? 'block' : 'hidden'} md:block transition-all duration-300`}>
        <DndContext 
          sensors={taskSensors} 
          collisionDetection={closestCenter}
          onDragEnd={(e) => onTaskReorder(e, realTasks)}
        >
          <SortableContext 
            items={realTasks.map((t: any) => `task-${t.id}`)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {realTasks.map((task: any) => (
                <SortableTask 
                  key={task.id} 
                  task={task} 
                  isManageMode={isManageMode}
                  handleToggle={handleToggle}
                  startEdit={startEdit}
                  onDeleteTask={onDeleteTask}
                  editingId={editingId}
                  editValue={editValue}
                  setEditValue={setEditValue}
                  saveEdit={saveEdit}
                />
              ))}
              {realTasks.length === 0 && (
                <p className="text-[10px] text-center text-slate-300 font-bold py-4 border-2 border-dashed border-slate-50 rounded-2xl">Belum ada tugas</p>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

export default function HomeClient({ initialCategories = [] }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState(initialCategories || []);
  const [activeTab, setActiveTab] = useState(initialCategories && initialCategories[0] ? initialCategories[0].id : 0);
  const [isPending, startTransition] = useTransition();
  const [isManageMode, setIsManageMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passError, setPassError] = useState('');
  
  const [editingId, setEditingId] = useState<{ type: 'category' | 'task' | 'section'; id: number } | null>(null);
  const [editingSectionName, setEditingSectionName] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showEditSectionModal, setShowEditSectionModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [modalData, setModalData] = useState<{ catId: number; section: string }>({ catId: 0, section: '' });
  const [newTaskContent, setNewTaskContent] = useState('');
  const [newSectionName, setNewSectionName] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const sensors = useMySensors();

  useEffect(() => {
    if (!isPending) {
      setCategories(initialCategories);
      if (activeTab === 0 && initialCategories && initialCategories[0]) {
        setActiveTab(initialCategories[0].id);
      }
    }
  }, [initialCategories, isPending, activeTab]);

  const [optimisticCategories] = useOptimistic(categories, (state) => state);

  const activeCategory = useMemo(() => 
    optimisticCategories.find(c => c.id === activeTab),
    [optimisticCategories, activeTab]
  );

  const groupedTasks = useMemo(() => {
    if (!activeCategory) return {};
    const groups = activeCategory.tasks.reduce((acc, task) => {
      const section = task.section || "A. Gate";
      if (!acc[section]) acc[section] = [];
      acc[section].push(task);
      return acc;
    }, {} as Record<string, Task[]>);

    Object.keys(groups).forEach(section => {
      groups[section].sort((a, b) => a.id - b.id);
    });

    const sortedSections = Object.keys(groups).sort((a, b) => a.localeCompare(b));
    
    return sortedSections.reduce((acc, key) => {
      acc[key] = groups[key];
      return acc;
    }, {} as Record<string, Task[]>);
  }, [activeCategory]);

  const handleSectionDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const sections = Object.keys(groupedTasks);
      const oldIndex = sections.findIndex(s => `section-${s}` === active.id);
      const newIndex = sections.findIndex(s => `section-${s}` === over.id);
      const newSectionsOrder = arrayMove(sections, oldIndex, newIndex);
      
      setCategories(prev => prev.map(cat => {
        if (cat.id === activeTab) {
          const orderedTasks: Task[] = [];
          newSectionsOrder.forEach(secName => orderedTasks.push(...groupedTasks[secName]));
          return { ...cat, tasks: orderedTasks };
        }
        return cat;
      }));
      
      // Persist by updating all task positions across sections
      const updates: any[] = [];
      let currentPos = 0;
      newSectionsOrder.forEach(secName => {
        groupedTasks[secName].forEach(task => {
          updates.push({ id: task.id, position: currentPos++, section: secName });
        });
      });
      await updateTaskPositions(updates);
    }
  };

  const handleTaskDragEnd = async (event: DragEndEvent, sectionTasks: Task[]) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const cleanActiveId = String(active.id).replace('task-', '');
      const cleanOverId = String(over.id).replace('task-', '');
      const oldIndex = sectionTasks.findIndex(t => String(t.id) === cleanActiveId);
      const newIndex = sectionTasks.findIndex(t => String(t.id) === cleanOverId);
      const newTasks = arrayMove(sectionTasks, oldIndex, newIndex);
      
      setCategories(prev => prev.map(cat => {
        if (cat.id === activeTab) {
          const otherTasks = cat.tasks.filter(t => t.section !== sectionTasks[0].section);
          const finalTasks = [...otherTasks, ...newTasks.map((t, idx) => ({ ...t, position: idx }))];
          return { ...cat, tasks: finalTasks };
        }
        return cat;
      }));
      
      const updates = newTasks.map((t, idx) => ({ id: t.id as number, position: idx }));
      await updateTaskPositions(updates);
    }
  };

  const handleToggle = (taskId: number, currentCompleted: boolean) => {
    if (isManageMode) return; 
    const nextState = !currentCompleted;
    startTransition(async () => {
      const result = await toggleTask(taskId, nextState);
      if (result.success) {
        setCategories(prev => prev.map(cat => ({
          ...cat,
          tasks: cat.tasks.map(task => 
            task.id === taskId ? { ...task, completed: nextState } : task
          )
        })));
      }
    });
  };

  const toggleExpand = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'JFK2026') {
      setIsManageMode(true);
      setShowPasswordModal(false);
      setPassword('');
      setPassError('');
    } else {
      setPassError('Password salah');
    }
  };

  const onAddCategory = async () => {
    const name = prompt('Nama Kategori Baru:');
    if (name?.trim()) await addCategory(name);
  };

  const handleSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionName.trim() || !activeTab) return;
    setIsSubmitting(true);
    const result = await addTask(activeTab, "--- Section Created ---", newSectionName.trim());
    setIsSubmitting(false);
    if (result.success) {
      setShowSectionModal(false);
      setNewSectionName('');
    }
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskContent.trim() || !modalData.catId) return;

    setIsSubmitting(true);
    const result = await addTask(modalData.catId, newTaskContent, modalData.section);
    
    if (result.success) {
      setShowSuccess(true);
      setNewTaskContent('');
      // Show success for 1.5 seconds then close
      setTimeout(() => {
        setShowSuccess(false);
        setShowTaskModal(false);
        setIsSubmitting(false);
      }, 1500);
    } else {
      setIsSubmitting(false);
      alert(result.error);
    }
  };

  const onAddTask = (catId: number, section: string) => {
    setModalData({ catId, section });
    setNewTaskContent('');
    setShowTaskModal(true);
  };

  const onDeleteTask = async (taskId: number) => {
    if (confirm('Hapus tugas ini?')) await deleteTask(taskId);
  };

  const onDeleteCategory = async (catId: number) => {
    setIsSubmitting(true);
    const result = await deleteCategory(catId);
    setIsSubmitting(false);
    if (result.success) {
      if (activeTab === catId) {
        const remaining = categories.filter(c => c.id !== catId);
        setActiveTab(remaining[0]?.id || 0);
      }
    } else {
      alert(result.error);
    }
  };

  const startEdit = (type: 'category' | 'task' | 'section', id: number, val: string) => {
    setEditingId({ type, id });
    setEditValue(val);
    if (type === 'section') {
      setEditingSectionName(val);
      setShowEditSectionModal(true);
    } else if (type === 'category') {
      setShowEditProjectModal(true);
    }
  };

  const saveEdit = async () => {
    if (!editingId || !editValue.trim()) return;
    
    setIsSubmitting(true);
    let result: { success: boolean; error?: string } = { success: false };

    try {
      if (editingId.type === 'section' && editingSectionName) {
        if (editValue !== editingSectionName) {
          result = await updateSectionPositions(activeTab, editingSectionName, editValue);
        } else {
          setShowEditSectionModal(false);
          setIsSubmitting(false);
          return;
        }
      } else if (editingId.type === 'category') {
        result = await updateCategory(editingId.id, editValue);
      } else if (editingId.type === 'task') {
        result = await updateTask(editingId.id, editValue);
      }
      
      if (result && result.success) {
        setEditingId(null);
        setEditingSectionName(null);
        setShowEditSectionModal(false);
        setShowEditProjectModal(false);
      } else {
        alert(result?.error || 'Gagal memperbarui');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan sistem');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalCompleted = useMemo(() => activeCategory?.tasks.filter(t => t.completed && !t.content.includes("---")).length || 0, [activeCategory]);
  const totalTasksCount = useMemo(() => activeCategory?.tasks.filter(t => !t.content.includes("---")).length || 0, [activeCategory]);
  const overallProgress = totalTasksCount > 0 ? Math.round((totalCompleted / totalTasksCount) * 100) : 0;

  return (
    <main className="min-h-screen bg-slate-50/50 pb-20">
      <div className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-100 flex-col p-6 z-30">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Jakarta Fair 2026</h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">IT Jiexpo</p>
        </div>
        <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
          {optimisticCategories.map((category) => (
            <div key={category.id} className="relative group/cat">
              <button
                onClick={() => setActiveTab(category.id)}
                className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-bold flex justify-between items-center transition-all ${
                  activeTab === category.id 
                    ? 'bg-slate-900 text-white shadow-lg' 
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <span className="truncate pr-8">{category.name}</span>
                <span className="text-[10px] opacity-50">{category.tasks.filter(t => !t.content.includes("---")).length}</span>
              </button>
              
              {isManageMode && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/cat:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      startEdit('category', category.id, category.name);
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${activeTab === category.id ? 'text-slate-400 hover:text-white' : 'text-slate-300 hover:text-indigo-600 hover:bg-white shadow-sm'}`}
                    title="Edit Nama Project"
                  >
                    <Edit3 size={12} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Hapus project "${category.name}" beserta seluruh tugas di dalamnya?`)) {
                        onDeleteCategory(category.id);
                      }
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${activeTab === category.id ? 'text-slate-400 hover:text-red-400' : 'text-slate-300 hover:text-red-500 hover:bg-white shadow-sm'}`}
                    title="Hapus Project"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </div>
          ))}
          {isManageMode && <button onClick={onAddCategory} className="w-full py-3 border-2 border-dashed border-slate-200 text-slate-400 rounded-2xl flex items-center justify-center hover:border-indigo-300 hover:text-indigo-50 transition-all"><Plus size={20} /></button>}
        </nav>
        <button onClick={() => isManageMode ? setIsManageMode(false) : setShowPasswordModal(true)} className={`w-full flex items-center justify-center gap-3 py-3 rounded-2xl transition-all font-bold text-sm ${isManageMode ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
          {isManageMode ? <><Unlock size={18} /> Matikan Edit</> : <><Lock size={18} /> Aktifkan Edit</>}
        </button>
      </div>

      <div className="md:ml-64 flex flex-col min-h-screen">
        <div className="max-w-6xl mx-auto w-full px-6 py-8 md:py-12 flex-1 flex flex-col">
          <header className="md:hidden flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-black text-slate-900">Jakarta Fair 2026</h1>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">IT Jiexpo</p>
            </div>
            <button onClick={() => isManageMode ? setIsManageMode(false) : setShowPasswordModal(true)} className={`w-10 h-10 flex items-center justify-center rounded-2xl border ${isManageMode ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-slate-400 border-slate-100'}`}><Unlock size={20} /></button>
          </header>

          <div className="md:hidden overflow-x-auto no-scrollbar flex gap-2 items-center mb-8">
            {optimisticCategories.map((category) => (
              <button key={category.id} onClick={() => setActiveTab(category.id)} className={`px-5 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap border ${activeTab === category.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100'}`}>{category.name}</button>
            ))}
          </div>

          <div className="flex-1 pb-32">
            {activeCategory ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900">{activeCategory.name}</h2>
                    <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-wider">Project Overview</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden md:block w-48 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-1000" 
                        style={{ width: `${overallProgress}%` }}
                      />
                    </div>
                    <div className="text-xs font-black uppercase text-slate-600 bg-white shadow-sm px-4 py-2 rounded-2xl border border-slate-100">
                      Progres: {overallProgress}%
                    </div>
                  </div>
                </div>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
                  <SortableContext items={Object.keys(groupedTasks).map(s => `section-${s}`)} strategy={verticalListSortingStrategy}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                      {Object.entries(groupedTasks).map(([section, tasks]) => (
                        <SortableSection 
                          key={section} 
                          sectionName={section} 
                          tasks={tasks} 
                          isManageMode={isManageMode} 
                          handleToggle={handleToggle} 
                          startEdit={startEdit} 
                          onDeleteTask={onDeleteTask} 
                          editingId={editingId} 
                          editValue={editValue} 
                          setEditValue={setEditValue} 
                          saveEdit={saveEdit} 
                          onAddTask={onAddTask} 
                          activeTab={activeTab} 
                          updateSectionPositions={updateSectionPositions} 
                          onTaskReorder={handleTaskDragEnd}
                          isExpanded={expandedSections[section] ?? true}
                          toggleExpand={() => toggleExpand(section)}
                        />
                      ))}
                      {isManageMode && (
                        <button onClick={() => setShowSectionModal(true)} className="h-full min-h-[150px] border-3 border-dashed border-slate-200 rounded-[32px] text-slate-400 flex flex-col items-center justify-center gap-3 hover:border-indigo-300 hover:bg-indigo-50/20 transition-all group">
                          <Plus size={24} />
                          <span className="font-bold text-sm">Tambah SUB Baru</span>
                        </button>
                      )}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 text-slate-300">
                <LayoutGrid size={64} className="mb-4 opacity-10" />
                <p className="font-bold">Silakan pilih kategori project di sebelah kiri</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="fixed bottom-0 right-0 left-0 md:left-64 p-6 pointer-events-none z-20">
        <div className="max-w-5xl mx-auto w-full flex justify-end">
          <div className="bg-slate-900 p-6 rounded-3xl shadow-2xl flex justify-between items-center text-white pointer-events-auto w-full md:max-w-md border border-white/5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black">{overallProgress}%</div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Progress</p>
                <p className="text-xl font-black">{totalCompleted} <span className="text-slate-500 text-xs">/ {totalTasksCount} SELESAI</span></p>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xs rounded-3xl p-8 shadow-2xl">
            <h3 className="text-center font-black text-xl text-slate-800 mb-6">Akses Edit</h3>
            <form onSubmit={handleAuth} className="space-y-4">
              <input type="password" autoFocus value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full px-4 py-3 rounded-2xl border border-slate-100 bg-slate-50 text-center font-bold outline-none" />
              {passError && <p className="text-red-500 text-[10px] font-bold text-center">{passError}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowPasswordModal(false)} className="flex-1 py-3 text-slate-400 font-bold text-sm">Batal</button>
                <button type="submit" className="flex-[2] py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm">Buka</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xs rounded-3xl p-8 shadow-2xl">
            <h3 className="text-center font-black text-xl text-slate-800 mb-6">Tambah SUB Baru</h3>
            <form onSubmit={handleSectionSubmit} className="space-y-4">
              <input autoFocus value={newSectionName} onChange={e => setNewSectionName(e.target.value)} placeholder="Nama Bagian" className="w-full px-4 py-3 rounded-2xl border border-slate-100 bg-slate-50 font-bold outline-none" required />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowSectionModal(false)} className="flex-1 py-3 text-slate-400 font-bold text-sm">Batal</button>
                <button type="submit" className="flex-[2] py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm">{isSubmitting ? '...' : 'Buat SUB'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xs rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            {showSuccess ? (
              <div className="py-8 text-center animate-in zoom-in duration-300">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check size={32} strokeWidth={3} />
                </div>
                <h3 className="font-black text-xl text-slate-800">Berhasil!</h3>
                <p className="text-slate-400 text-sm font-bold mt-1">Tugas telah ditambahkan</p>
              </div>
            ) : (
              <>
                <div className="bg-indigo-50 w-12 h-12 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 mx-auto">
                  <Plus size={24} />
                </div>
                <h3 className="text-center font-black text-xl text-slate-800 mb-2">Tambah Tugas</h3>
                <p className="text-center text-slate-400 text-[10px] font-black uppercase tracking-widest mb-6">
                  Bagian: <span className="text-indigo-600">{modalData.section}</span>
                </p>
                <form onSubmit={handleTaskSubmit} className="space-y-4">
                  <textarea 
                    autoFocus 
                    value={newTaskContent} 
                    onChange={e => setNewTaskContent(e.target.value)} 
                    placeholder="Contoh:&#10;Pasang Kabel LAN&#10;Setting Router&#10;(Gunakan Enter untuk tambah banyak sekaligus)" 
                    rows={5} 
                    className="w-full px-4 py-3 rounded-2xl border border-slate-100 bg-slate-50 font-medium resize-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm" 
                    required 
                  />
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={() => setShowTaskModal(false)} 
                      className="flex-1 py-3 text-slate-400 font-bold text-sm"
                      disabled={isSubmitting}
                    >
                      Batal
                    </button>
                    <button 
                      type="submit" 
                      className="flex-[2] py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm active:scale-95 shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        'Simpan Tugas'
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {showEditProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xs rounded-3xl p-8 shadow-2xl">
            <h3 className="text-center font-black text-xl text-slate-800 mb-6">Edit Nama Project</h3>
            <form onSubmit={(e) => { e.preventDefault(); saveEdit(); }} className="space-y-4">
              <input 
                autoFocus 
                value={editValue} 
                onChange={e => setEditValue(e.target.value)} 
                className="w-full px-4 py-3 rounded-2xl border border-slate-100 bg-slate-50 font-bold outline-none" 
                required 
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowEditProjectModal(false)} className="flex-1 py-3 text-slate-400 font-bold text-sm">Batal</button>
                <button type="submit" className="flex-[2] py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm" disabled={isSubmitting}>
                  {isSubmitting ? '...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditSectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xs rounded-3xl p-8 shadow-2xl">
            <h3 className="text-center font-black text-xl text-slate-800 mb-6">Edit Nama Bagian</h3>
            <form onSubmit={(e) => { e.preventDefault(); saveEdit(); }} className="space-y-4">
              <input 
                autoFocus 
                value={editValue} 
                onChange={e => setEditValue(e.target.value)} 
                className="w-full px-4 py-3 rounded-2xl border border-slate-100 bg-slate-50 font-bold outline-none" 
                required 
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowEditSectionModal(false)} className="flex-1 py-3 text-slate-400 font-bold text-sm">Batal</button>
                <button type="submit" className="flex-[2] py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm" disabled={isSubmitting}>
                  {isSubmitting ? '...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
