import { BarChart3, Edit, Eye, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../../../../shared/components/ui/Button'
import { LoadingSpinner } from '../../../../shared/components/ui/LoadingSpinner'
import { supabase } from '../../../../shared/lib/supabase'
import { useAuth } from '../../../auth/contexts/AuthContext'
import { Article } from '../../../learning/types/article'
import { ArticleEditor } from './ArticleEditor'

interface ArticleManagementProps {
  authorId?: string; // Optional prop for filtering by author
}

export function ArticleManagement({ authorId }: ArticleManagementProps) {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditor, setShowEditor] = useState(false)
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  const [saving, setSaving] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    fetchArticles()
  }, [])

  const fetchArticles = async () => {
    try {
      setLoading(true)

      // Build query based on whether we're filtering by author
      let query = supabase.from('articles').select('*')

      // If authorId is provided, filter by that author
      // Otherwise, filter by current user's articles (users can only manage their own articles)
      if (authorId) {
        query = query.eq('author_id', authorId)
      } else if (user) {
        // All users can only see their own articles
        query = query.eq('author_id', user.id)
      }

      // Sort by created date
      query = query.order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) throw error
      setArticles(data || [])
    } catch (error) {
      console.error('Error fetching articles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveArticle = async (articleData: Partial<Article>) => {
    try {
      setSaving(true);

      // If the user selects "Published", set status to "pending_review"
      const newArticleData = {
        ...articleData,
        status: articleData.status === 'published' ? 'pending_review' : articleData.status,
        author_id: user?.id || null,
      };

      if (editingArticle) {
        // Update existing article
        const { error } = await supabase
          .from('articles')
          .update(newArticleData)
          .eq('id', editingArticle.id)
          .eq('author_id', user?.id);

        if (error) throw error;
      } else {
        // Create new article
        const { error } = await supabase.from('articles').insert([newArticleData]);

        if (error) throw error;
      }

      await fetchArticles();
      setShowEditor(false);
      setEditingArticle(null);
    } catch (error) {
      console.error('Error saving article:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return

    try {
      // Security check: only allow deleting own articles
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', id)
        .eq('author_id', user?.id)

      if (error) throw error
      await fetchArticles()
    } catch (error) {
      console.error('Error deleting article:', error)
    }
  }

  const handleEditArticle = (article: Article) => {
    setEditingArticle(article)
    setShowEditor(true)
  }

  const handleCreateNew = () => {
    setEditingArticle(null)
    setShowEditor(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Don't render anything if user is not authenticated
  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please log in to manage articles.</p>
      </div>
    )
  }

  if (showEditor) {
    return (
      <ArticleEditor
        article={editingArticle || undefined}
        onSave={handleSaveArticle}
        onCancel={() => {
          setShowEditor(false)
          setEditingArticle(null)
        }}
        loading={saving}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Article Management</h2>
        <Button onClick={handleCreateNew} className="flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Create New Article
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Article
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {articles.map((article) => (
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
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium capitalize">
                        {article.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${article.status === 'published' ? 'bg-green-100 text-green-800' :
                        article.status === 'pending_review' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                        {article.status === 'pending_review' ? 'Under Review' :
                          article.status === 'published' ? 'Published' :
                            'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Eye className="w-4 h-4 mr-1 text-gray-400" />
                        {article.view_count}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(article.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {article.status === 'published' && (
                          <a
                            href={`/learning/${article.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => handleEditArticle(article)}
                          className={`text-indigo-600 hover:text-indigo-900 ${article.status === 'pending_review' ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          disabled={article.status === 'pending_review'}
                          title={article.status === 'pending_review' ? 'Cannot edit while under review' : 'Edit article'}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteArticle(article.id)}
                          className={`text-red-600 hover:text-red-900 ${article.status === 'pending_review' ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          disabled={article.status === 'pending_review'}
                          title={article.status === 'pending_review' ? 'Cannot delete while under review' : 'Delete article'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {articles.length === 0 && (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No articles yet</h3>
              <p className="text-gray-600 mb-4">Create your first article to get started.</p>
              <Button onClick={handleCreateNew}>
                <Plus className="w-4 h-4 mr-2" />
                Create Article
              </Button>
            </div>
          )}
        </div>
      )
      }
    </div >
  )
}

export default ArticleManagement;