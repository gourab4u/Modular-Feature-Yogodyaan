import { AlertTriangle, CheckCircle, MessageSquare, X, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../shared/components/ui/Button';
import { WorkflowArticle } from '../types/workflow';

interface ReviewModalProps {
  article: WorkflowArticle;
  action: 'approve' | 'reject';
  onSubmit: (moderationNotes?: string) => Promise<void>;
  onCancel: () => void;
}

export function ReviewModal({ article, action, onSubmit, onCancel }: ReviewModalProps) {
  const [moderationNotes, setModerationNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (action === 'reject' && !moderationNotes.trim()) {
      setError('Moderation notes are required when rejecting an article.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await onSubmit(moderationNotes.trim() || undefined);
    } catch (err: any) {
      setError(err.message || 'An error occurred while processing the review.');
    } finally {
      setSubmitting(false);
    }
  };

  const isApproval = action === 'approve';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              {isApproval ? (
                <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600 mr-2" />
              )}
              <h3 className="text-lg font-semibold text-gray-900">
                {isApproval ? 'Approve Article' : 'Reject Article'}
              </h3>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Article Preview */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-gray-900 mb-2">Article Details</h4>
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-700">Title:</span>
                <span className="text-sm text-gray-900 ml-2">{article.title}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Author:</span>
                <span className="text-sm text-gray-900 ml-2">
                  {article.author?.full_name || article.author?.email || 'Unknown'}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Category:</span>
                <span className="text-sm text-gray-900 ml-2 capitalize">{article.category}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Version:</span>
                <span className="text-sm text-gray-900 ml-2">v{article.version_number}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Preview:</span>
                <p className="text-sm text-gray-900 mt-1">{article.preview_text}</p>
              </div>
            </div>
          </div>

          {/* Action Confirmation */}
          <div className={`border rounded-lg p-4 mb-6 ${
            isApproval ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
          }`}>
            <div className="flex items-start">
              {isApproval ? (
                <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
              )}
              <div>
                <h4 className={`font-medium ${isApproval ? 'text-green-800' : 'text-red-800'}`}>
                  {isApproval ? 'Approve and Publish' : 'Reject Article'}
                </h4>
                <p className={`text-sm mt-1 ${isApproval ? 'text-green-700' : 'text-red-700'}`}>
                  {isApproval
                    ? 'This article will be published and made visible to all users. The author will be notified of the approval.'
                    : 'This article will be returned to draft status. The author will be notified and can make revisions based on your feedback.'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Moderation Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MessageSquare className="w-4 h-4 inline mr-1" />
              {isApproval ? 'Approval Notes (Optional)' : 'Rejection Feedback (Required)'}
            </label>
            <textarea
              value={moderationNotes}
              onChange={(e) => setModerationNotes(e.target.value)}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                error && action === 'reject' ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={
                isApproval
                  ? 'Add any notes about the approval (optional)...'
                  : 'Explain why this article is being rejected and what changes are needed...'
              }
            />
            {error && (
              <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
            {!isApproval && (
              <p className="text-gray-500 text-sm mt-1">
                Please provide constructive feedback to help the author improve their article.
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              loading={submitting}
              className={`flex items-center ${
                isApproval
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isApproval ? (
                <CheckCircle className="w-4 h-4 mr-2" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              {submitting
                ? (isApproval ? 'Approving...' : 'Rejecting...')
                : (isApproval ? 'Approve & Publish' : 'Reject Article')
              }
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}