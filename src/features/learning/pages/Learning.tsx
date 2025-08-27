import { Award, BookOpen, Gift, Heart, MessageCircle, PenTool, Star, Users, Zap } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LoadingSpinner } from '../../../shared/components/ui/LoadingSpinner'
import { useAuth } from '../../auth/contexts/AuthContext'
import { ArticleCard } from '../components/ArticleCard'
import { ArticleFilters } from '../components/ArticleFilters'
import { useArticles } from '../hooks/useArticles'

export function Learning() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'highest_rated'>('latest')
  const { user } = useAuth()
  const navigate = useNavigate()

  const { articles, loading, error, refetch } = useArticles()

  // Handler for writing article buttons
  function handleStartWriting() {
    if (!user) {
      navigate('/login', { state: { message: 'You need to sign in to start writing articles.', redirectTo: '/articles/new' } })
    } else {
      navigate('/articles/new')
    }
  }

  // Extract unique categories/modules for sidebar
  const categories = useMemo(() => {
    const cats = Array.from(new Set(articles.map(a => a.category)))
    return ['all', ...cats]
  }, [articles])

  // Memoize filtered articles
  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      const matchesSearch = searchTerm === '' ||
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.preview_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [articles, searchTerm, selectedCategory])

  // Refetch when filters change (except search)
  useEffect(() => {
    refetch({
      category: selectedCategory,
      sortBy: sortBy
    })
  }, [selectedCategory, sortBy, refetch])

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg">
          <p className="text-red-600 dark:text-red-400 mb-4">Failed to load articles: {error}</p>
          <button
            onClick={() => refetch()}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-flex items-center bg-blue-100 dark:bg-blue-900 rounded-full px-4 py-2 mb-6">
              <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
              <span className="text-blue-800 dark:text-blue-300 font-medium">Build Your Yoga Community</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Share Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Yoga Journey</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto">
              Skip expensive classes! Join our growing community of yoga enthusiasts. Write articles, share wisdom, earn rewards, and connect with fellow practitioners worldwide.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
                onClick={handleStartWriting}
              >
                <PenTool className="w-5 h-5 inline mr-2" />
                Start Writing Articles
              </button>
              <button className="bg-white text-blue-600 border-2 border-blue-200 px-8 py-4 rounded-full font-semibold text-lg hover:bg-blue-50 transition-all">
                <Users className="w-5 h-5 inline mr-2" />
                Join Community
              </button>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 animate-bounce">
          <div className="bg-white/60 p-3 rounded-full shadow-sm">
            <Heart className="w-6 h-6 text-rose-500" />
          </div>
        </div>
        <div className="absolute top-32 right-20 animate-pulse">
          <div className="bg-white/60 p-3 rounded-full shadow-sm">
            <Star className="w-6 h-6 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Stats & Benefits */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
          <div className="text-center p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-200 dark:border-slate-600">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-600 dark:text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Growing</h3>
            <p className="text-gray-600 dark:text-slate-300">Community of Yogis</p>
          </div>
          <div className="text-center p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-200 dark:border-slate-600">
            <div className="w-16 h-16 bg-green-100 dark:bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-green-600 dark:text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Fresh</h3>
            <p className="text-gray-600 dark:text-slate-300">Content Daily</p>
          </div>
          <div className="text-center p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-200 dark:border-slate-600">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-amber-600 dark:text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Earn</h3>
            <p className="text-gray-600 dark:text-slate-300">Rewards for Quality</p>
          </div>
          <div className="text-center p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-200 dark:border-slate-600">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-rose-600 dark:text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">100%</h3>
            <p className="text-gray-600 dark:text-slate-300">Free to Join</p>
          </div>
        </div>

        {/* Why Join Section */}
        <div className="bg-gradient-to-r from-slate-100 to-blue-100 dark:from-slate-800 dark:to-slate-800 rounded-3xl p-8 md:p-12 mb-16 border border-gray-200 dark:border-slate-600">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Why Choose Our Community?</h2>
            <p className="text-gray-600 dark:text-slate-300 text-lg">No expensive classes, no rigid schedules - just pure yoga wisdom sharing</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Gift className="w-10 h-10 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Earn Rewards</h3>
              <p className="text-gray-600 dark:text-slate-300">Get recognized for quality articles, build your reputation, and unlock exclusive perks</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <MessageCircle className="w-10 h-10 text-green-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Connect & Learn</h3>
              <p className="text-gray-600 dark:text-slate-300">Network with practitioners worldwide, share experiences, and grow together</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Zap className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Complete Freedom</h3>
              <p className="text-gray-600 dark:text-slate-300">No class schedules, no fees - practice and share at your own pace</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar: Categories */}
          <aside className="lg:w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-600 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Learning Modules</h2>
                <p className="text-sm text-gray-500 dark:text-slate-300">Choose your path</p>
              </div>
            </div>

            <ul className="space-y-2">
              {categories.map(category => (
                <li key={category}>
                  <button
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all font-medium ${selectedCategory === category
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-600 dark:text-white shadow-sm'
                      : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900 dark:hover:bg-slate-700 dark:text-slate-300 dark:hover:text-white'
                      }`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category === 'all' ? '🧘‍♀️ All Modules' : `🌟 ${category}`}
                  </button>
                </li>
              ))}
            </ul>

            {/* Write Article CTA */}
            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-700">
              <div className="text-center">
                <PenTool className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">Share Your Knowledge</h3>
                <p className="text-sm text-gray-600 dark:text-slate-300 mb-3">Write articles and earn rewards!</p>
                <button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-semibold transition-all"
                  onClick={handleStartWriting}
                >
                  Start Writing
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-600 p-6 mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <ArticleFilters
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                  />
                </div>
                <div className="flex items-center gap-2 text-gray-500 dark:text-slate-300 text-sm">
                  <Star className="w-4 h-4" />
                  <span>{filteredArticles.length} lesson{filteredArticles.length !== 1 ? 's' : ''} found</span>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            )}

            {/* Articles List */}
            {!loading && (
              <>
                {filteredArticles.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-600">
                    <div className="w-24 h-24 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
                      <BookOpen className="w-12 h-12 text-gray-400 dark:text-slate-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">No lessons found</h3>
                    <p className="text-gray-600 dark:text-slate-300 mb-6">
                      {searchTerm || selectedCategory !== 'all'
                        ? 'Try adjusting your search or filter criteria.'
                        : 'Be the first to contribute to this module!'}
                    </p>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-semibold transition-all">
                      <PenTool className="w-5 h-5 inline mr-2" />
                      Write the First Article
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredArticles.map((article) => (
                      <ArticleCard key={article.id} article={article} />
                    ))}
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}