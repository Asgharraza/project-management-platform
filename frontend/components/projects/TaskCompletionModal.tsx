'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { X, CheckCircle, Clock, AlertCircle, MessageSquare } from 'lucide-react';

interface TaskCompletionModalProps {
  taskId: string;
  taskTitle: string;
  onClose: () => void;
  onComplete: () => void;
}

export default function TaskCompletionModal({
  taskId,
  taskTitle,
  onClose,
  onComplete,
}: TaskCompletionModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [completionNote, setCompletionNote] = useState('');
  const [selectedOption, setSelectedOption] = useState('complete');

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      // Update task status based on option
      let newStatus = '';
      let message = '';

      switch (selectedOption) {
        case 'complete':
          newStatus = 'DONE';
          message = 'Task completed successfully! 🎉';
          break;
        case 'review':
          newStatus = 'REVIEW';
          message = 'Task submitted for review.';
          break;
        case 'blocked':
          newStatus = 'TODO';
          message = 'Task is blocked. Please check comments for details.';
          break;
        default:
          newStatus = 'DONE';
      }

      // Update task status
      await api.put(`/tasks/${taskId}`, { 
        status: newStatus 
      });

      // Add completion note as comment if provided
      if (completionNote || selectedOption === 'blocked') {
        let commentContent = completionNote;
        if (selectedOption === 'blocked' && !completionNote) {
          commentContent = '🚫 Task is blocked. Need assistance.';
        } else if (selectedOption === 'review') {
          commentContent = `📋 Ready for review!\n${completionNote}`;
        } else if (selectedOption === 'complete') {
          commentContent = `✅ Task completed!\n${completionNote}`;
        }
        
        await api.post(`/tasks/${taskId}/comments`, { 
          content: commentContent 
        });
      }

      onComplete();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Complete Task</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-gray-600 mb-4">
          Task: <span className="font-medium">{taskTitle}</span>
        </p>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div 
            className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
              selectedOption === 'complete' 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-200 hover:bg-gray-50'
            }`}
            onClick={() => setSelectedOption('complete')}
          >
            <CheckCircle className={`w-5 h-5 ${selectedOption === 'complete' ? 'text-green-600' : 'text-gray-400'}`} />
            <div>
              <p className="font-medium text-gray-900">Complete Task</p>
              <p className="text-sm text-gray-500">Task is done and ready</p>
            </div>
          </div>

          <div 
            className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
              selectedOption === 'review' 
                ? 'border-purple-500 bg-purple-50' 
                : 'border-gray-200 hover:bg-gray-50'
            }`}
            onClick={() => setSelectedOption('review')}
          >
            <AlertCircle className={`w-5 h-5 ${selectedOption === 'review' ? 'text-purple-600' : 'text-gray-400'}`} />
            <div>
              <p className="font-medium text-gray-900">Request Review</p>
              <p className="text-sm text-gray-500">Need manager approval</p>
            </div>
          </div>

          <div 
            className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
              selectedOption === 'blocked' 
                ? 'border-red-500 bg-red-50' 
                : 'border-gray-200 hover:bg-gray-50'
            }`}
            onClick={() => setSelectedOption('blocked')}
          >
            <Clock className={`w-5 h-5 ${selectedOption === 'blocked' ? 'text-red-600' : 'text-gray-400'}`} />
            <div>
              <p className="font-medium text-gray-900">Blocked</p>
              <p className="text-sm text-gray-500">Need help or waiting for something</p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Completion Note
          </label>
          <textarea
            value={completionNote}
            onChange={(e) => setCompletionNote(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Add a note about this task..."
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Submit'}
        </button>
      </div>
    </div>
  );
}