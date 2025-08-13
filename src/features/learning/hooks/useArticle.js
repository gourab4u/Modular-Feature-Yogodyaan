import { useEffect, useState } from 'react';
import { supabase } from '../../../shared/lib/supabase';
import { getFingerprint } from '../../../shared/utils/fingerprint';
export function useArticle(id) {
    const [article, setArticle] = useState(null);
    const [ratings, setRatings] = useState([]);
    const [userRating, setUserRating] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchArticle = async () => {
        try {
            setLoading(true);
            setError(null);
            // Fetch article with author full_name
            const { data: articleData, error: articleError } = await supabase
                .from('articles')
                .select('*, author:profiles(full_name)')
                .eq('id', id)
                .eq('status', 'published')
                .single();
            if (articleError)
                throw articleError;
            setArticle(articleData);
            // Fetch ratings without author selection (since ratings table doesn’t have author_id)
            const { data: ratingsData, error: ratingsError } = await supabase
                .from('ratings')
                .select('*')
                .eq('article_id', id);
            if (ratingsError)
                throw ratingsError;
            setRatings(ratingsData || []);
            // Check if user has already rated
            const fingerprint = await getFingerprint();
            const existingRating = ratingsData?.find(r => r.fingerprint === fingerprint);
            setUserRating(existingRating?.rating || null);
            // Record view
            await recordView(id, fingerprint);
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    };
    const recordView = async (articleId, fingerprint) => {
        try {
            await supabase
                .from('article_views')
                .insert([{
                    article_id: articleId,
                    fingerprint: fingerprint
                }]);
        }
        catch (error) {
            // Silently fail - view tracking is not critical
            console.warn('Failed to record article view:', error);
        }
    };
    const submitRating = async (rating) => {
        try {
            const fingerprint = await getFingerprint();
            const { error } = await supabase
                .from('ratings')
                .upsert([{
                    article_id: id,
                    rating: rating,
                    fingerprint: fingerprint
                }], {
                onConflict: 'article_id,fingerprint'
            });
            if (error)
                throw error;
            setUserRating(rating);
            // Refetch ratings to update the display
            fetchArticle();
        }
        catch (err) {
            throw new Error(err.message);
        }
    };
    useEffect(() => {
        if (id) {
            fetchArticle();
        }
    }, [id]);
    const averageRating = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;
    return {
        article,
        ratings,
        userRating,
        averageRating: Math.round(averageRating * 10) / 10,
        totalRatings: ratings.length,
        loading,
        error,
        submitRating,
        refetch: fetchArticle
    };
}
