import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../shared/lib/supabase';
export function useArticles() {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchArticles = useCallback(async (filters) => {
        try {
            setLoading(true);
            setError(null);
            console.log('Fetching articles with filters:', filters);
            let query = supabase
                .from('articles')
                .select(`
          *,
          ratings(rating)
        `)
                .eq('status', 'published');
            // Apply category filter
            if (filters?.category && filters.category !== 'all') {
                query = query.eq('category', filters.category);
            }
            // Apply sorting
            switch (filters?.sortBy) {
                case 'popular':
                    query = query.order('view_count', { ascending: false });
                    break;
                case 'latest':
                default:
                    query = query.order('published_at', { ascending: false });
                    break;
            }
            // Apply limit
            if (filters?.limit) {
                query = query.limit(filters.limit);
            }
            const { data, error: fetchError } = await query;
            if (fetchError) {
                console.error('Supabase error:', fetchError);
                throw fetchError;
            }
            console.log('Raw articles data:', data);
            // Calculate ratings for each article
            const articlesWithStats = data?.map(article => {
                const ratings = article.ratings || [];
                const totalRatings = ratings.length;
                const averageRating = totalRatings > 0
                    ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
                    : 0;
                return {
                    ...article,
                    average_rating: Math.round(averageRating * 10) / 10,
                    total_ratings: totalRatings
                };
            }) || [];
            // Sort by highest rated if requested
            if (filters?.sortBy === 'highest_rated') {
                articlesWithStats.sort((a, b) => {
                    if (a.average_rating === b.average_rating) {
                        return b.total_ratings - a.total_ratings;
                    }
                    return b.average_rating - a.average_rating;
                });
            }
            console.log('Processed articles:', articlesWithStats);
            setArticles(articlesWithStats);
        }
        catch (err) {
            console.error('Error in fetchArticles:', err);
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        fetchArticles();
    }, [fetchArticles]);
    return {
        articles,
        loading,
        error,
        refetch: fetchArticles
    };
}
