import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../shared/lib/supabase';
import { useAuth } from '../../auth/contexts/AuthContext';
import { ArticleAuditLog, ArticleNotification, ArticleVersion, ModerationStatus, WorkflowArticle } from '../types/workflow';

export function useArticleWorkflow() {
  const [articles, setArticles] = useState<WorkflowArticle[]>([]);
  const [notifications, setNotifications] = useState<ArticleNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, userRoles } = useAuth();

  const isSanghaGuide = userRoles.includes('sangha_guide');

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('articles')
        .select(`
          *,
          author:profiles!articles_author_id_fkey(id, full_name, email)
        `);

      // Sangha guides can see all articles, users only see their own
      if (!isSanghaGuide && user) {
        query = query.eq('author_id', user.id);
      }

      const { data, error: fetchError } = await query.order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;
      setArticles(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, isSanghaGuide]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('article_notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;
      setNotifications(data || []);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchArticles();
    fetchNotifications();
  }, [fetchArticles, fetchNotifications]);

  const createArticle = async (articleData: Partial<WorkflowArticle>) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('articles')
      .insert([{
        ...articleData,
        author_id: user.id,
        moderation_status: 'draft',
        version_number: 1,
        status: 'draft'
      }])
      .select()
      .single();

    if (error) throw error;
    await fetchArticles();
    return data;
  };

  const updateArticle = async (id: string, updates: Partial<WorkflowArticle>) => {
    if (!user) throw new Error('User not authenticated');

    // Increment version number if content changed
    const currentArticle = articles.find(a => a.id === id);
    if (currentArticle && (
      updates.title !== currentArticle.title ||
      updates.content !== currentArticle.content ||
      updates.preview_text !== currentArticle.preview_text ||
      JSON.stringify(updates.tags) !== JSON.stringify(currentArticle.tags)
    )) {
      updates.version_number = (currentArticle.version_number || 1) + 1;
    }

    const { data, error } = await supabase
      .from('articles')
      .update(updates)
      .eq('id', id)
      .eq('author_id', user.id) // Ensure user can only update their own articles
      .select()
      .single();

    if (error) throw error;
    await fetchArticles();
    return data;
  };

  const autoSaveArticle = async (id: string, updates: Partial<WorkflowArticle>) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('articles')
      .update({
        ...updates,
        auto_saved_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('author_id', user.id)
      .select()
      .single();

    if (error) throw error;
    await fetchArticles();
    return data;
  };

  const submitForReview = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('articles')
      .update({
        moderation_status: 'pending_review',
        submitted_for_review_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('author_id', user.id)
      .select()
      .single();

    if (error) throw error;
    await fetchArticles();
    return data;
  };

  const approveArticle = async (id: string) => {
    if (!isSanghaGuide) throw new Error('Insufficient permissions');

    const { data, error } = await supabase
      .from('articles')
      .update({
        moderation_status: 'approved',
        status: 'published',
        published_at: new Date().toISOString(),
        moderated_by: user?.id,
        moderated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    await fetchArticles();
    return data;
  };

  const rejectArticle = async (id: string, moderationNotes: string) => {
    if (!isSanghaGuide) throw new Error('Insufficient permissions');
    if (!moderationNotes.trim()) throw new Error('Moderation notes are required for rejection');

    const { data, error } = await supabase
      .from('articles')
      .update({
        moderation_status: 'rejected',
        status: 'draft',
        moderation_notes: moderationNotes,
        moderated_by: user?.id,
        moderated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    await fetchArticles();
    return data;
  };

  const getArticleVersions = async (articleId: string): Promise<ArticleVersion[]> => {
    const { data, error } = await supabase
      .from('article_versions')
      .select('*')
      .eq('article_id', articleId)
      .order('version_number', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const getArticleAuditLog = async (articleId: string): Promise<ArticleAuditLog[]> => {
    const { data, error } = await supabase
      .from('article_audit_log')
      .select('*')
      .eq('article_id', articleId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const markNotificationAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('article_notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('recipient_id', user?.id);

    if (error) throw error;
    await fetchNotifications();
  };

  const getUnreadNotificationCount = () => {
    return notifications.filter(n => !n.is_read).length;
  };

  return {
    articles,
    notifications,
    loading,
    error,
    isSanghaGuide,
    createArticle,
    updateArticle,
    autoSaveArticle,
    submitForReview,
    approveArticle,
    rejectArticle,
    getArticleVersions,
    getArticleAuditLog,
    markNotificationAsRead,
    getUnreadNotificationCount,
    refetch: fetchArticles
  };
}