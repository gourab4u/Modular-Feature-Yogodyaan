import { AlertCircle, Clock, Eye, Save, Send, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Button } from '../../../shared/components/ui/Button';
import { useArticleWorkflow } from '../hooks/useArticleWorkflow';
import { ModerationStatus, WorkflowArticle } from '../types/workflow';

interface ArticleWorkflowEditorProps {
  article?: WorkflowArticle;
  onSave?: (article: WorkflowArticle) => void;
  onCancel?: () => void;
}

export function ArticleWorkflowEditor({ article, onSave, onCancel }: ArticleWorkflowEditorProps) {
  const { createArticle, updateArticle, autoSaveArticle, submitForReview, loading } = useArticleWorkflow();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    preview_text: '',
    image_url: '',
    video_url: '',
    category: 'general',
    tags: [] as string[]
  });
  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  const categories = [
    'general', 'beginner', 'wellness', 'corporate', 'advanced', 'meditation', 'nutrition'
  ];

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean']
    ],
  };

  // Initialize form data
  useEffect(() => {
    if (article) {
      setFormData({
        title: article.title,
        content: article.content,
        preview_text: article.preview_text,
        image_url: article.image_url || '',
        video_url: article.video_url || '',
        category: article.category,
        tags: article.tags || []
      });
    }
  }, [article]);

  // Auto-save functionality
  const triggerAutoSave = useCallback(async () => {
    if (!article || !formData.title.trim()) return;

    try {
      setAutoSaving(true);
      await autoSaveArticle(article.id, formData);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setAutoSaving(false);
    }
  }, [article, formData, autoSaveArticle]);

  // Set up auto-save timer
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    if (article && formData.title.trim()) {
      autoSaveTimeoutRef.current = setTimeout(() => {
        triggerAutoSave();
      }, 30000); // Auto-save every 30 seconds
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [formData, triggerAutoSave, article]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    else if (formData.title.length > 60) newErrors.title = 'Title must be 60 characters or less';

    if (!formData.content.trim()) newErrors.content = 'Content is required';

    if (!formData.preview_text.trim()) newErrors.preview_text = 'Preview text is required';
    else if (formData.preview_text.length > 150) newErrors.preview_text = 'Preview text must be 150 characters or less';

    if (formData.image_url && !isValidUrl(formData.image_url)) {
      newErrors.image_url = 'Please enter a valid image URL';
    }

    if (formData.video_url && !isValidVideoUrl(formData.video_url)) {
      newErrors.video_url = 'Please enter a valid YouTube or Vimeo URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const isValidVideoUrl = (url: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    const vimeoRegex = /^(https?:\/\/)?(www\.)?vimeo\.com\/.+/;
    return youtubeRegex.test(url) || vimeoRegex.test(url);
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      let savedArticle;

      if (article) {
        savedArticle = await updateArticle(article.id, formData);
      } else {
        savedArticle = await createArticle(formData);
      }

      setLastSaved(new Date());
      onSave?.(savedArticle);
    } catch (error: any) {
      setErrors({ general: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!article) {
      // Save first if it's a new article
      await handleSave();
      return;
    }

    if (!validateForm()) return;

    try {
      setSaving(true);
      // Save current changes first
      await updateArticle(article.id, formData);
      // Then submit for review
      await submitForReview(article.id);
      onSave?.(article);
    } catch (error: any) {
      setErrors({ general: error.message });
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: ModerationStatus) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending_review': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canSubmitForReview = article?.moderation_status === 'draft' || article?.moderation_status === 'rejected';
  const isReadOnly = article?.moderation_status === 'pending_review';

  return (
    <div className="bg-white rounded-xl shadow-lg">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {article ? 'Edit Article' : 'Create New Article'}
            </h2>
            {article && (
              <div className="flex items-center space-x-4 mt-2">
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(article.moderation_status)}`}>
                  {article.moderation_status.replace('_', ' ').toUpperCase()}
                </span>
                <span className="text-sm text-gray-500">
                  Version {article.version_number}
                </span>
                {lastSaved && (
                  <span className="text-sm text-gray-500 flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    Last saved: {lastSaved.toLocaleTimeString()}
                  </span>
                )}
                {autoSaving && (
                  <span className="text-sm text-blue-600 flex items-center">
                    <Clock className="w-4 h-4 mr-1 animate-spin" />
                    Auto-saving...
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="w-4 h-4 mr-1" />
              {showPreview ? 'Edit' : 'Preview'}
            </Button>
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>

      {isReadOnly && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
            <span className="text-yellow-800">
              This article is currently under review and cannot be edited.
            </span>
          </div>
        </div>
      )}

      {article?.moderation_status === 'rejected' && article.moderation_notes && (
        <div className="bg-red-50 border-b border-red-200 p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
            <div>
              <h4 className="text-red-800 font-medium">Article Rejected</h4>
              <p className="text-red-700 mt-1">{article.moderation_notes}</p>
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        {showPreview ? (
          <div className="prose prose-lg max-w-none">
            <h1>{formData.title}</h1>
            <p className="text-gray-600 italic">{formData.preview_text}</p>
            {formData.image_url && (
              <img src={formData.image_url} alt={formData.title} className="w-full rounded-lg" />
            )}
            <div dangerouslySetInnerHTML={{ __html: formData.content }} />
            {formData.tags.length > 0 && (
              <div className="mt-6">
                <h4>Tags:</h4>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <form className="space-y-6">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{errors.general}</p>
              </div>
            )}

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                disabled={isReadOnly}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                } ${isReadOnly ? 'bg-gray-50' : ''}`}
                placeholder="Enter article title (max 60 characters)"
                maxLength={60}
              />
              <div className="flex justify-between mt-1">
                {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
                <p className="text-gray-500 text-sm ml-auto">{formData.title.length}/60</p>
              </div>
            </div>

            {/* Preview Text */}
            <div>
              <label htmlFor="preview_text" className="block text-sm font-medium text-gray-700 mb-1">
                Preview Text *
              </label>
              <textarea
                id="preview_text"
                value={formData.preview_text}
                onChange={(e) => handleInputChange('preview_text', e.target.value)}
                disabled={isReadOnly}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.preview_text ? 'border-red-500' : 'border-gray-300'
                } ${isReadOnly ? 'bg-gray-50' : ''}`}
                placeholder="Brief description that appears in article cards (max 150 characters)"
                maxLength={150}
              />
              <div className="flex justify-between mt-1">
                {errors.preview_text && <p className="text-red-500 text-sm">{errors.preview_text}</p>}
                <p className="text-gray-500 text-sm ml-auto">{formData.preview_text.length}/150</p>
              </div>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                disabled={isReadOnly}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isReadOnly ? 'bg-gray-50' : ''
                }`}
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Image URL */}
            <div>
              <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-1">
                Featured Image URL
              </label>
              <input
                type="url"
                id="image_url"
                value={formData.image_url}
                onChange={(e) => handleInputChange('image_url', e.target.value)}
                disabled={isReadOnly}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.image_url ? 'border-red-500' : 'border-gray-300'
                } ${isReadOnly ? 'bg-gray-50' : ''}`}
                placeholder="https://example.com/image.jpg"
              />
              {errors.image_url && <p className="text-red-500 text-sm mt-1">{errors.image_url}</p>}
            </div>

            {/* Video URL */}
            <div>
              <label htmlFor="video_url" className="block text-sm font-medium text-gray-700 mb-1">
                Video URL (YouTube/Vimeo)
              </label>
              <input
                type="url"
                id="video_url"
                value={formData.video_url}
                onChange={(e) => handleInputChange('video_url', e.target.value)}
                disabled={isReadOnly}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.video_url ? 'border-red-500' : 'border-gray-300'
                } ${isReadOnly ? 'bg-gray-50' : ''}`}
                placeholder="https://youtube.com/watch?v=..."
              />
              {errors.video_url && <p className="text-red-500 text-sm mt-1">{errors.video_url}</p>}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
                  >
                    #{tag}
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
              {!isReadOnly && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add a tag"
                  />
                  <Button
                    type="button"
                    onClick={handleAddTag}
                    variant="outline"
                    size="sm"
                  >
                    Add Tag
                  </Button>
                </div>
              )}
            </div>

            {/* Content Editor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content *
              </label>
              <div className={`border rounded-lg ${errors.content ? 'border-red-500' : 'border-gray-300'}`}>
                <ReactQuill
                  value={formData.content}
                  onChange={(content) => handleInputChange('content', content)}
                  modules={quillModules}
                  theme="snow"
                  readOnly={isReadOnly}
                  style={{ minHeight: '300px' }}
                />
              </div>
              {errors.content && <p className="text-red-500 text-sm mt-1">{errors.content}</p>}
            </div>

            {/* Action Buttons */}
            {!isReadOnly && (
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSave}
                  loading={saving}
                  className="flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save as Draft
                </Button>
                {canSubmitForReview && (
                  <Button
                    type="button"
                    onClick={handleSubmitForReview}
                    loading={saving}
                    className="flex items-center"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Submit for Review
                  </Button>
                )}
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}