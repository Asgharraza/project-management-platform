'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Task, TaskComment, User } from '@/types';
import { X, Trash2, Send, Calendar, User as UserIcon, Clock, Activity } from 'lucide-react';

interface TaskDetailModalProps {
  taskId: string;
  projectId: string;
  onClose: () => void;
  onTaskUpdated: () => void;
}

export default function TaskDetailModal({
  taskId,
  projectId,
  onClose,
  onTaskUpdated,
}: TaskDetailModalProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [teamMembers, setTeamMembers] = useState<User[]>([]);

  useEffect(() => {
    fetchTaskDetails();
    fetchComments();
    fetchActivities();
    fetchTeamMembers();
  }, [taskId]);

  const fetchTaskDetails = async () => {
    try {
      const response = await api.get(`/projects/${projectId}/tasks`);
      const tasks = response.data;
      const foundTask = tasks.find((t: Task) => t.id === taskId);
      setTask(foundTask || null);
    } catch (error) {
      console.error('Failed to fetch task:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await api.get(`/tasks/${taskId}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await api.get(`/tasks/${taskId}/activities`);
      setActivities(response.data);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const response = await api.get(`/projects/${projectId}`);
      const members = response.data.members || [];
      setTeamMembers(members.map((m: any) => m.user));
    } catch (error) {
      console.error('Failed to fetch team members:', error);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      setUpdating(true);
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      onTaskUpdated();
      fetchTaskDetails();
      fetchActivities();
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleAssigneeChange = async (assigneeId: string) => {
    try {
      setUpdating(true);
      await api.put(`/tasks/${taskId}`, { assigneeId });
      onTaskUpdated();
      fetchTaskDetails();
      fetchActivities();
    } catch (error) {
      console.error('Failed to update assignee:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      setUpdating(true);
      await api.delete(`/tasks/${taskId}`);
      onTaskUpdated();
      onClose();
    } catch (error) {
      console.error('Failed to delete task:', error);
      setError('Failed to delete task');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      await api.post(`/tasks/${taskId}/comments`, { content: newComment });
      setNewComment('');
      fetchComments();
      fetchActivities();
      onTaskUpdated();
    } catch (error) {
      console.error('Failed to add comment:', error);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'TODO': return '🔵';
      case 'IN_PROGRESS': return '🟡';
      case 'REVIEW': return '🟣';
      case 'DONE': return '🟢';
      default: return '⚪';
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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6">
          <p className="text-center text-gray-500">Loading task...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6">
          <p className="text-center text-red-500">Task not found</p>
          <button onClick={onClose} className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{task.title}</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                {getStatusIcon(task.status)} {task.status.replace('_', ' ')}
              </span>
              <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                {getPriorityBadge(task.priority)}
              </span>
              {task.dueDate && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Task Metadata */}
        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-xs text-gray-500">Project</p>
            <p className="text-sm font-medium">{task.project?.name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Created</p>
            <p className="text-sm font-medium">
              {new Date(task.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Description</h3>
            <p className="text-sm text-gray-600">{task.description}</p>
          </div>
        )}

        {/* Assignee Management */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <UserIcon className="w-4 h-4" />
            Assigned To
          </h3>
          <select
            value={task.assigneeId || ''}
            onChange={(e) => handleAssigneeChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">Unassigned</option>
            {teamMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} ({member.email})
              </option>
            ))}
          </select>
        </div>

        {/* Status Update */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Update Status</h3>
          <div className="flex flex-wrap gap-2">
            {['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'].map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                disabled={updating || task.status === status}
                className={`px-3 py-1 rounded-lg text-sm transition ${
                  task.status === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } disabled:opacity-50`}
              >
                {getStatusIcon(status)} {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Comments */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Comments</h3>
          <div className="space-y-3 max-h-48 overflow-y-auto mb-3">
            {comments.length === 0 ? (
              <p className="text-gray-400 text-sm">No comments yet</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-sm text-gray-900">
                      {comment.user?.name || 'Unknown'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{comment.content}</p>
                </div>
              ))
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
              placeholder="Add a comment..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <button
              onClick={handleAddComment}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Activity Log */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Activity Log
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {activities.length === 0 ? (
              <p className="text-gray-400 text-sm">No activity yet</p>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-2 text-sm">
                  <span className="text-gray-400 text-xs whitespace-nowrap">
                    {new Date(activity.createdAt).toLocaleTimeString()}
                  </span>
                  <span className="text-gray-700">
                    <span className="font-medium">{activity.user?.name || 'System'}</span>
                    {' ' + activity.details || activity.action}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
          <button
            onClick={handleDelete}
            disabled={updating}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}