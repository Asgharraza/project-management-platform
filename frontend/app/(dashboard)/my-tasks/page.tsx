'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { Task, Project } from '@/types';
import { CheckCircle, Clock, AlertCircle, Filter, Search } from 'lucide-react';
import TaskDetailModal from '@/components/projects/TaskDetailModal';

export default function MyTasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const fetchMyTasks = async () => {
    try {
      // Get all projects (member has access to their projects)
      const projectsRes = await api.get('/projects');
      const allProjects = projectsRes.data;
      setProjects(allProjects);

      // Get all tasks from all projects and filter by assignee
      const allTasks = allProjects.flatMap((p: Project) => p.tasks || []);
      
      // Filter tasks assigned to current user
      const myTasks = allTasks.filter((t: Task) => t.assigneeId === user?.id);
      setTasks(myTasks);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DONE': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'IN_PROGRESS': return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'REVIEW': return <AlertCircle className="w-5 h-5 text-purple-600" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (filter !== 'ALL' && task.status !== filter) return false;
    if (search && !task.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Stats
  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'TODO').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    review: tasks.filter(t => t.status === 'REVIEW').length,
    done: tasks.filter(t => t.status === 'DONE').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>
        <p className="text-gray-600 mt-1">Manage all tasks assigned to you</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">To Do</p>
          <p className="text-2xl font-bold text-gray-600">{stats.todo}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">In Progress</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Review</p>
          <p className="text-2xl font-bold text-purple-600">{stats.review}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Done</p>
          <p className="text-2xl font-bold text-green-600">{stats.done}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {['ALL', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1 rounded-full text-sm transition ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No tasks found</p>
          <p className="text-sm text-gray-400 mt-1">
            {tasks.length === 0
              ? 'You have no tasks assigned yet.'
              : 'Try adjusting your filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const project = projects.find(p => p.id === task.projectId);
            return (
              <div
                key={task.id}
                onClick={() => setSelectedTaskId(task.id)}
                className="bg-white rounded-lg shadow p-4 hover:shadow-md transition cursor-pointer"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{task.title}</h3>
                      <span className="text-xs text-gray-400">
                        {project?.name || 'No project'}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-sm text-gray-600 line-clamp-1">
                        {task.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                      <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      {task.dueDate && (
                        <span className="text-xs text-gray-400">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(task.status)}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Quick status update
                        const nextStatus = {
                          'TODO': 'IN_PROGRESS',
                          'IN_PROGRESS': 'REVIEW',
                          'REVIEW': 'DONE',
                          'DONE': 'TODO',
                        }[task.status] || 'TODO';
                        handleQuickStatusUpdate(task.id, nextStatus);
                      }}
                      className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-100 transition"
                    >
                      {task.status === 'DONE' ? 'Reopen' : 'Update Status'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          projectId={tasks.find(t => t.id === selectedTaskId)?.projectId || ''}
          onClose={() => setSelectedTaskId(null)}
          onTaskUpdated={fetchMyTasks}
        />
      )}
    </div>
  );

  // Quick status update function
  async function handleQuickStatusUpdate(taskId: string, newStatus: string) {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      fetchMyTasks();
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  }
}