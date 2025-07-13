import { Calendar, Clock, FileText, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../../shared/components/ui/Button';
import { LoadingSpinner } from '../../../shared/components/ui/LoadingSpinner';
import { useArticleWorkflow } from '../hooks/useArticleWorkflow';
import { ArticleVersion, WorkflowArticle } from '../types/workflow';

interface VersionHistoryModalProps {
  article: WorkflowArticle;
  onClose: () => void;
}

export function VersionHistoryModal({ article, onClose }: VersionHistoryModalProps) {
  const { getArticleVersions, getArticleAuditLog } = useArticleWorkflow();
  const [versions, setVersions] = useState<ArticleVersion[]>([]);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'versions' | 'audit'>('versions');
  const [selectedVersion, setSelectedVersion] = useState<ArticleVersion | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [versionsData, auditData] = await Promise.all([
          getArticleVersions(article.id),
          getArticleAuditLog(article.id)
        ]);
        setVersions(versionsData);
        setAuditLog(auditData);
      } catch (error) {
        console.error('Error fetching version history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [article.id, getArticleVersions, getArticleAuditLog]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created': return 'bg-blue-100 text-blue-800';
      case 'updated': return 'bg-gray-100 text-gray-800';
      case 'submitted_for_review': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'auto_saved': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created': return <FileText className="w-4 h-4" />;
      case 'updated': return <FileText className="w-4 h-4" />;
      case 'submitted_for_review': return <Clock className="w-4 h-4" />;
      case 'approved': return <FileText className="w-4 h-4" />;
      case 'rejected': return <X className="w-4 h-4" />;
      case 'auto_saved': return <Clock className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  if (selectedVersion) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Version {selectedVersion.version_number} - {selectedVersion.title}
              </h3>
              <button
                onClick={() => setSelectedVersion(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Created {formatDate(selectedVersion.created_at)}
            </p>
          </div>

          <div className="p-6">
            <div className="prose prose-lg max-w-none">
              <h1>{selectedVersion.title}</h1>
              {selectedVersion.preview_text && (
                <p className="text-gray-600 italic">{selectedVersion.preview_text}</p>
              )}
              <div dangerouslySetInnerHTML={{ __html: selectedVersion.content }} />
              {selectedVersion.tags && selectedVersion.tags.length > 0 && (
                <div className="mt-6">
                  <h4>Tags:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedVersion.tags.map((tag, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 border-t border-gray-200">
            <Button
              onClick={() => setSelectedVersion(null)}
              variant="outline"
            >
              Back to History
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Article History - {article.title}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('versions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'versions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-1" />
              Versions ({versions.length})
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'audit'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-1" />
              Activity Log ({auditLog.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
              {activeTab === 'versions' && (
                <div className="space-y-4">
                  {versions.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No version history available</p>
                    </div>
                  ) : (
                    versions.map((version) => (
                      <div
                        key={version.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedVersion(version)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-medium text-gray-900">
                                Version {version.version_number}
                              </span>
                              {version.version_number === article.version_number && (
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                  Current
                                </span>
                              )}
                            </div>
                            <h4 className="font-medium text-gray-900 mb-1">{version.title}</h4>
                            {version.change_summary && (
                              <p className="text-sm text-gray-600 mb-2">{version.change_summary}</p>
                            )}
                            <div className="flex items-center text-sm text-gray-500">
                              <Calendar className="w-4 h-4 mr-1" />
                              {formatDate(version.created_at)}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedVersion(version);
                            }}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'audit' && (
                <div className="space-y-4">
                  {auditLog.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No activity log available</p>
                    </div>
                  ) : (
                    auditLog.map((log) => (
                      <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-full ${getActionColor(log.action)}`}>
                            {getActionIcon(log.action)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                                {log.action.replace('_', ' ').toUpperCase()}
                              </span>
                              <span className="text-sm text-gray-500">
                                {formatDate(log.created_at)}
                              </span>
                            </div>
                            <div className="text-sm text-gray-900">
                              {log.old_status && log.new_status && (
                                <p>Status changed from <strong>{log.old_status}</strong> to <strong>{log.new_status}</strong></p>
                              )}
                              {log.notes && (
                                <p className="mt-1 text-gray-600">{log.notes}</p>
                              )}
                              {log.metadata?.title && (
                                <p className="mt-1">
                                  <span className="font-medium">Title:</span> {log.metadata.title}
                                </p>
                              )}
                              {log.metadata?.version_number && (
                                <p className="mt-1">
                                  <span className="font-medium">Version:</span> {log.metadata.version_number}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-6 border-t border-gray-200">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}