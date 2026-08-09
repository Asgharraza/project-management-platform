'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { Project, Task } from '@/types';
import { 
  ArrowLeft, 
  Plus, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Users,
  Calendar,
  Flag
} from 'lucide-react';
import CreateTaskModal from '@/components/projects/CreateTaskModal';
import TaskDetailModal from '@/components/projects/TaskDetailModal';
import TaskCompletionModal from '@/components/projects/TaskCompletionModal';
import ProjectChat from '@/components/projects/ProjectChat';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState<string | null>(null);

  const projectId = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : null;

  useEffect(() => {
    if (!projectId) {
      setError('Project ID not found');
      setLoading(false);
      return;
    }
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/projects/${projectId}`);
      setProject(response.data);
      setError('');
    } catch (err: any) {
      console.error('Error fetching project:', err);
      if (err.response?.status === 404) {
        setError('Project not found');
      } else if (err.response?.status === 403) {
        setError('You do not have access to this project');
      } else {
        setError('Failed to load project');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO': return 'bg-gray-100 text-gray-700';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-700';
      case 'REVIEW': return 'bg-purple-100 text-purple-700';
      case 'DONE': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-red-600';
      case 'MEDIUM': return 'text-yellow-600';
      case 'LOW': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'HIGH': return '🔴 High';
      case 'MEDIUM': return '🟡 Medium';
      case 'LOW': return '🟢 Low';
      default: return priority;
    }
  };

  const canManage = user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER';

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  const handleCompleteClick = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    const task = project?.tasks?.find(t => t.id === taskId);
    if (task && (task.status === 'TODO' || task.status === 'IN_PROGRESS')) {
      setShowCompletionModal(taskId);
    }
  };

  // ✅ Delete Task Handler
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await api.delete(`/tasks/${taskId}`);
      fetchProject();
    } catch (error) {
      console.error('Failed to delete task:', error);
      alert('Failed to delete task. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || 'Project not found'}</p>
        <Link href="/projects" className="text-blue-600 hover:underline mt-4 inline-block">
          ← Back to Projects
        </Link>
      </div>
    );
  }

  const todoTasks = project.tasks?.filter((t) => t.status === 'TODO') || [];
  const inProgressTasks = project.tasks?.filter((t) => t.status === 'IN_PROGRESS') || [];
  const reviewTasks = project.tasks?.filter((t) => t.status === 'REVIEW') || [];
  const doneTasks = project.tasks?.filter((t) => t.status === 'DONE') || [];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link href="/projects" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>

        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-600 mt-1">{project.description || 'No description'}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {canManage && (
              <button
                onClick={() => setShowCreateTask(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Task
              </button>
            )}
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              project.status === 'ACTIVE'
                ? 'bg-green-100 text-green-700'
                : project.status === 'COMPLETED'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {project.status}
            </span>
          </div>
        </div>

        {/* Project Meta */}
        <div className="flex flex-wrap gap-6 mt-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span className="font-medium">Manager:</span> {project.manager?.name || 'N/A'}
          </div>
          <div className="flex items-center gap-1">
            <Flag className="w-4 h-4" />
            <span className="font-medium">Priority:</span>{' '}
            <span className={getPriorityColor(project.priority)}>
              {getPriorityBadge(project.priority)}
            </span>
          </div>
          {project.startDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">Start:</span>{' '}
              {new Date(project.startDate).toLocaleDateString()}
            </div>
          )}
          {project.endDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">End:</span>{' '}
              {new Date(project.endDate).toLocaleDateString()}
            </div>
          )}
          <div>
            <span className="font-medium">Members:</span> {project.members?.length || 0}
          </div>
          <div>
            <span className="font-medium">Tasks:</span> {project.tasks?.length || 0}
          </div>
        </div>
      </div>

      {/* Task Board - Kanban Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { status: 'TODO', tasks: todoTasks, color: 'bg-gray-50', label: 'To Do' },
          { status: 'IN_PROGRESS', tasks: inProgressTasks, color: 'bg-yellow-50', label: 'In Progress' },
          { status: 'REVIEW', tasks: reviewTasks, color: 'bg-purple-50', label: 'Review' },
          { status: 'DONE', tasks: doneTasks, color: 'bg-green-50', label: 'Done' },
        ].map((column) => (
          <div key={column.status} className={`${column.color} rounded-lg p-4 min-h-[200px]`}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-700">{column.label}</h3>
              <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                {column.tasks.length}
              </span>
            </div>
            <div className="space-y-2">
              {column.tasks.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">No tasks</p>
              ) : (
                column.tasks.map((task) => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onTaskClick={handleTaskClick}
                    onCompleteClick={handleCompleteClick}
                    onDeleteTask={handleDeleteTask}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Project Chat */}
      <div className="mt-8">
        <ProjectChat projectId={project.id} />
      </div>

      {/* Modals */}
      {showCreateTask && (
        <CreateTaskModal
          projectId={project.id}
          onClose={() => setShowCreateTask(false)}
          onTaskCreated={fetchProject}
        />
      )}

      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          projectId={project.id}
          onClose={() => setSelectedTaskId(null)}
          onTaskUpdated={fetchProject}
        />
      )}

      {showCompletionModal && (
        <TaskCompletionModal
          taskId={showCompletionModal}
          taskTitle={project.tasks?.find(t => t.id === showCompletionModal)?.title || ''}
          onClose={() => setShowCompletionModal(null)}
          onComplete={fetchProject}
        />
      )}
    </div>
  );
}

// Task Card Component
interface TaskCardProps {
  task: Task;
  onTaskClick: (id: string) => void;
  onCompleteClick: (e: React.MouseEvent, id: string) => void;
  onDeleteTask: (id: string) => void;
}

function TaskCard({ task, onTaskClick, onCompleteClick, onDeleteTask }: TaskCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DONE': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'IN_PROGRESS': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'REVIEW': return <AlertCircle className="w-4 h-4 text-purple-600" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'border-l-4 border-red-500';
      case 'MEDIUM': return 'border-l-4 border-yellow-500';
      case 'LOW': return 'border-l-4 border-green-500';
      default: return 'border-l-4 border-gray-300';
    }
  };

  const getPriorityEmoji = (priority: string) => {
    switch (priority) {
      case 'HIGH': return '🔴';
      case 'MEDIUM': return '🟡';
      case 'LOW': return '🟢';
      default: return '⚪';
    }
  };

  const showComplete = task.status === 'TODO' || task.status === 'IN_PROGRESS';

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete task "${task.title}"?`)) {
      onDeleteTask(task.id);
    }
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm p-3 ${getPriorityColor(task.priority)} hover:shadow-md transition cursor-pointer`}
      onClick={() => onTaskClick(task.id)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 text-sm">{task.title}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500">
              {getPriorityEmoji(task.priority)} {task.priority}
            </span>
            <span className="text-xs text-gray-500">
              {task.assignee?.name || 'Unassigned'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2">
          {getStatusIcon(task.status)}
        </div>
      </div>
      {task.dueDate && (
        <p className="text-xs text-gray-400 mt-2">
          📅 Due: {new Date(task.dueDate).toLocaleDateString()}
        </p>
      )}
      <div className="flex gap-2 mt-2">
        {showComplete && (
          <button
            onClick={(e) => onCompleteClick(e, task.id)}
            className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-lg hover:bg-green-200 transition flex-1 text-center"
          >
            ✅ Complete
          </button>
        )}
        <button
          onClick={handleDelete}
          className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-lg hover:bg-red-200 transition flex-1 text-center"
        >
          🗑️ Delete
        </button>
      </div>
    </div>
  );
}