'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { Project, Task } from '@/types';
import { Plus } from 'lucide-react';
import CreateProjectModal from '@/components/projects/CreateProjectModal';

export default function DashboardPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    onHold: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get('/projects');
      const data = response.data;
      setProjects(data);

      // Get all tasks from all projects
      const allTasks = data.flatMap((p: Project) => p.tasks || []);
      
      // Filter tasks assigned to current user
      const userTasks = allTasks.filter((t: Task) => t.assigneeId === user?.id);
      setMyTasks(userTasks);

      // Calculate stats
      setStats({
        total: data.length,
        active: data.filter((p: Project) => p.status === 'ACTIVE').length,
        completed: data.filter((p: Project) => p.status === 'COMPLETED').length,
        onHold: data.filter((p: Project) => p.status === 'ON_HOLD').length,
      });
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const canCreate = user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER';

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600 mt-1">Here's an overview of your projects</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5" />
            New Project
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Total Projects</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-3xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Completed</p>
          <p className="text-3xl font-bold text-blue-600">{stats.completed}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">On Hold</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.onHold}</p>
        </div>
      </div>

      {/* My Tasks Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">My Tasks</h2>
          <Link href="/my-tasks" className="text-sm text-blue-600 hover:underline">
            View all →
          </Link>
        </div>
        {loading ? (
          <p className="text-gray-500">Loading tasks...</p>
        ) : myTasks.length === 0 ? (
          <p className="text-gray-500">No tasks assigned to you yet.</p>
        ) : (
          <div className="space-y-3">
            {myTasks.slice(0, 5).map((task) => {
              const project = projects.find(p => p.id === task.projectId);
              return (
                <Link
                  key={task.id}
                  href={`/projects/${task.projectId}`}
                  className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition"
                >
                  <div>
                    <p className="font-medium text-gray-900">{task.title}</p>
                    <p className="text-sm text-gray-500">{project?.name || 'No project'}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    task.status === 'DONE' ? 'bg-green-100 text-green-700' :
                    task.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-700' :
                    task.status === 'REVIEW' ? 'bg-purple-100 text-purple-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Projects */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Recent Projects
        </h2>
        {loading ? (
          <p className="text-gray-500">Loading projects...</p>
        ) : projects.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No projects yet.</p>
            {canCreate && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-blue-600 hover:underline mt-2"
              >
                Create your first project →
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {projects.slice(0, 5).map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition"
              >
                <div>
                  <h3 className="font-medium text-gray-900">{project.name}</h3>
                  <p className="text-sm text-gray-500">
                    {project.manager?.name || 'Unassigned'} • {project._count?.tasks || 0} tasks
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    project.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-700'
                      : project.status === 'COMPLETED'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {project.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onProjectCreated={fetchData}
        />
      )}
    </div>
  );
}