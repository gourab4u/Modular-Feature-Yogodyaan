import { CheckCircle, Clock, Edit, Eye, FileText, History, MessageSquare, Plus, X, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../shared/components/ui/Button';
import { LoadingSpinner } from '../../../shared/components/ui/LoadingSpinner';
import { useArticleWorkflow } from '../hooks/useArticleWorkflow';
import { ModerationStatus, WorkflowArticle } from '../types/workflow';
import { ArticleWorkflowEditor } from './ArticleWorkflowEditor';
import { ReviewModal } from './ReviewModal';
import { VersionHistoryModal } from './VersionHistoryModal';

export function ArticleWorkflowList() {
  const {
    articles,
    loading,
    error,
    isSanghaGuide,
    approveArticle,
    rejectArticle,
    refetch
  } = useArticleWorkflow();

  const [selectedArticle, setSelectedArticle] = useState<WorkflowArticle | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [filterStatus, setFilterStatus] = useState<ModerationStatus | 'all'>('all');

  const filteredArticles = articles.filter(article => 
    filterStatus === 'all' || article.moderation_status === filterStatus
  );

  const getStatusColor = (status: ModerationStatus) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending_review': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: ModerationStatus) => {
    switch (status) {
      case 'draft': return <FileText className="w-4 h-4" />;
      case 'pending_review': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleEdit = (article: WorkflowArticle) => {
    setSelectedArticle(article);
    setShowEditor(true);
  };

  const handleReview = (article: WorkflowArticle, action: 'approve' | 'reject') => {
    setSelectedArticle(article);
    setReviewAction(action);
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async (moderationNotes?: string) => {
    if (!selectedArticle) return;

    try {
      if (reviewAction === 'approve') {
        await approveArticle(selectedArticle.id);
      } else {
        await rejectArticle(selectedArticle.id, moderationNotes || '');
      }
      setShowReviewModal(false);
      setSelectedArticle(null);
    } catch (error) {
      console.error('Review action failed:', error);
    }
  };

  const handleVersionHistory = (article: WorkflowArticle) => {
    setSelectedArticle(article);
    setShowVersionHistory(true);
  };

  const canEdit = (article: WorkflowArticle) => {
    return article.moderation_status === 'draft' || article.moderation_status === 'rejected';
  };

  const canReview = (article: WorkflowArticle) => {
    return isSanghaGuide && article.moderation_status === 'pending_review';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <div className="text-red-600 font-semibold mb-2">Error Loading Articles</div>
        <div className="text-red-500 text-sm mb-4">{error}</div>
        <Button onClick={refetch} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (showEditor) {
    return (
      <ArticleWorkflowEditor
        article={selectedArticle || undefined}
        onSave={() => {
          setShowEditor(false);
          setSelectedArticle(null);
          refetch();
        }}
        onCancel={() => {
          setShowEditor(false);
          setSelectedArticle(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {isSanghaGuide ? 'Article Review Dashboard' : 'My Articles'}
        </h2>
        <div className="flex items-center space-x-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ModerationStatus | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="pending_review">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <Button
            onClick={() => {
              setSelectedArticle(null);
              setShowEditor(true);
            }}
            className="flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Article
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="text-3xl font-bold text-gray-600 mb-2">
            {articles.filter(a => a.moderation_status === 'draft').length}
          </div>
          <div className="text-gray-600">Drafts</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="text-3xl font-bold text-yellow-600 mb-2">
            {articles.filter(a => a.moderation_status === 'pending_review').length}
          </div>
          <div className="text-gray-600">Pending Review</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {articles.filter(a => a.moderation_status === 'approved').length}
          </div>
          <div className="text-gray-600">Published</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="text-3xl font-bold text-red-600 mb-2">
            {articles.filter(a => a.moderation_status === 'rejected').length}
          </div>
          <div className="text-gray-600">Rejected</div>
        </div>
      </div>

      {/* Articles List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {filteredArticles.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No articles found</h3>
            <p className="text-gray-600 mb-4">
              {filterStatus === 'all' 
                ? 'Create your first article to get started.'
                : `No articles with status "${filterStatus}".`
              }
            </p>
            {filterStatus === 'all' && (
              <Button
                onClick={() => {
                  setSelectedArticle(null);
                  setShowEditor(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Article
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Article
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Version
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  {isSanghaGuide && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Author
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredArticles.map((article) => (
                  <tr key={article.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {article.image_url && (
                          <img
                            src={article.image_url}
                            alt=""
                            className="w-12 h-12 rounded object-cover mr-4"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900 line-clamp-1">
                            {article.title}
                          </div>
                          <div className="text-sm text-gray-500 line-clamp-2">
                            {article.preview_text}
                          </div>
                          <div className="flex items-center mt-1">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium capitalize">
                              {article.category}
                            </span>
                            {article.auto_saved_at && (
                              <span className="ml-2 text-xs text-gray-500">
                                Auto-saved {formatDate(article.auto_saved_at)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${getStatusColor(article.moderation_status)}`}>
                          {getStatusIcon(article.moderation_status)}
                          <span className="ml-1 capitalize">
                            {article.moderation_status.replace('_', ' ')}
                          </span>
                        </span>
                      </div>
                      {article.moderation_status === 'rejected' && article.moderation_notes && (
                        <div className="mt-1 text-xs text-red-600 max-w-xs truncate" title={article.moderation_notes}>
                          {article.moderation_notes}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      v{article.version_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(article.updated_at)}
                    </td>
                    {isSanghaGuide && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {article.author?.full_name || article.author?.email || 'Unknown'}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {article.moderation_status === 'approved' && (
                          <a
                            href={`/learning/${article.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900"
                            title="View Published"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                        )}
                        
                        {canEdit(article) && (
                          <button
                            onClick={() => handleEdit(article)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => handleVersionHistory(article)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Version History"
                        >
                          <History className="w-4 h-4" />
                        </button>

                        {canReview(article) && (
                          <>
                            <button
                              onClick={() => handleReview(article, 'approve')}
                              className="text-green-600 hover:text-green-900"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReview(article, 'reject')}
                              className="text-red-600 hover:text-red-900"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showReviewModal && selectedArticle && (
        <ReviewModal
          article={selectedArticle}
          action={reviewAction}
          onSubmit={handleReviewSubmit}
          onCancel={() => {
            setShowReviewModal(false);
            setSelectedArticle(null);
          }}
        />
      )}

      {showVersionHistory && selectedArticle && (
        <VersionHistoryModal
          article={selectedArticle}
          onClose={() => {
            setShowVersionHistory(false);
            setSelectedArticle(null);
          }}
        />
      )}
    </div>
  );
}