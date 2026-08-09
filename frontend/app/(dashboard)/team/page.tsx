'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { User, Project } from '@/types';
import { UserPlus, X, Trash2, Users, AlertCircle } from 'lucide-react';

export default function TeamPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [success, setSuccess] = useState('');

  const canManage = user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get projects (members can see projects they're in)
      const projectsRes = await api.get('/projects');
      const projectData = projectsRes.data || [];
      setProjects(projectData);

      // Only admins can see all users
      if (canManage) {
        const usersRes = await api.get('/users');
        setUsers(usersRes.data || []);
      } else {
        // For team members, get users from their projects
        const allMembers = projectData.flatMap((p: Project) => p.members || []);
        const uniqueUsers = allMembers.map((m: any) => m.user);
        // Remove duplicates by id
        const uniqueMap = new Map();
        uniqueUsers.forEach((u: User) => uniqueMap.set(u.id, u));
        setUsers(Array.from(uniqueMap.values()));
      }
    } catch (err: any) {
      console.error('Failed to fetch team data:', err);
      if (err.response?.status === 403) {
        setError('You do not have permission to view team members.');
      } else {
        setError('Failed to load team data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      
      await api.post(`/projects/${selectedProject}/members`, {
        userId: selectedUser,
        role: 'MEMBER',
      });
      
      setSuccess('Team member added successfully!');
      setShowAddMember(false);
      setSelectedProject('');
      setSelectedUser('');
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add team member');
    }
  };

  const handleRemoveMember = async (projectId: string, memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;
    
    try {
      await api.delete(`/projects/${projectId}/members/${memberId}`);
      fetchData();
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading team data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchData}
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600 mt-1">
            {canManage 
              ? 'Manage team members across all projects' 
              : 'View team members in your projects'}
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowAddMember(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <UserPlus className="w-5 h-5" />
            Add Team Member
          </button>
        )}
      </div>

      {success && (
        <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-6">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Team Members List */}
      {projects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No projects found.</p>
          <p className="text-sm text-gray-400 mt-1">
            {canManage 
              ? 'Create a project to start building your team.' 
              : 'You are not assigned to any projects yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                  <p className="text-sm text-gray-500">
                    Manager: {project.manager?.name || 'Unassigned'}
                  </p>
                </div>
                <span className="text-sm text-gray-500">
                  {project.members?.length || 0} members
                </span>
              </div>
              
              {project.members?.length === 0 ? (
                <p className="text-gray-400 text-sm">No team members assigned</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {project.members.map((member) => {
                    // Check if current user can manage this project
                    const canManageProject = 
                      user?.role === 'ADMIN' || 
                      (user?.role === 'PROJECT_MANAGER' && project.managerId === user?.id);
                    
                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium">
                            {member.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{member.user.name}</p>
                            <p className="text-sm text-gray-500">{member.user.email}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              member.role === 'LEAD' 
                                ? 'bg-purple-100 text-purple-700' 
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {member.role}
                            </span>
                          </div>
                        </div>
                        {canManageProject && (
                          <button
                            onClick={() => handleRemoveMember(project.id, member.id)}
                            className="text-red-400 hover:text-red-600 transition p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Member Modal - Only for Managers/Admins */}
      {showAddMember && canManage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Add Team Member</h2>
              <button
                onClick={() => setShowAddMember(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a project</option>
                  {projects.filter(p => 
                    user?.role === 'ADMIN' || p.managerId === user?.id
                  ).map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a user</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
              >
                Add Member
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}