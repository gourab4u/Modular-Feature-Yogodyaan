import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import { UserRole } from './shared/config/roleConfig'
import { User as CustomUserType } from './shared/types/user'
// Context imports - updated paths
import { AdminProvider } from './features/admin/contexts/AdminContext'
import { AuthProvider, useAuth } from './features/auth/contexts/AuthContext'
import { NotificationProvider } from './features/notifications/contexts/NotificationContext'
import { ThemeProvider } from './shared/contexts/ThemeContext'
// Layout components - updated paths
import { Footer } from './shared/components/layout/Footer'
import { Header } from './shared/components/layout/Header'
// Auth components - updated paths
import { ProtectedAdminRoute } from './features/auth/components/ProtectedAdminRoute'
import { ProtectedRoute } from './features/auth/components/ProtectedRoute'
// Dashboard component - new import
import UniversalDashboard from './features/dashboard/components/UniversalDashboard'
// Page imports - updated paths
import { AdminDashboard } from './features/admin/pages/AdminDashboard'
import { AdminLogin } from './features/auth/pages/AdminLogin'
import { Login } from './features/auth/pages/Login'
import { ArticleView } from './features/learning/pages/ArticleView'
import { Learning } from './features/learning/pages/Learning'
import { About } from './features/marketing/pages/About'
import { Contact } from './features/marketing/pages/Contact'
import { Home } from './features/marketing/pages/Home'
import { Services } from './features/marketing/pages/Services'
import { Testimonials } from './features/marketing/pages/Testimonials'
import { BookClass } from './features/scheduling/pages/BookClass'
import InstructorProfile from './features/scheduling/pages/InstructorProfile'
import { Schedule } from './features/scheduling/pages/Schedule'
import { Profile } from './features/user-profile/pages/Profile'
import { NotFound } from './pages/NotFound'
import { BookOneOnOne } from './features/scheduling/pages/BookOneOnOne'
import { BookCorporate } from './features/scheduling/pages/BookCorporate'


function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <NotificationProvider>
            <AdminProvider>
              <AppRoutes />
            </AdminProvider>
          </NotificationProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  )
}

function AppRoutes() {
  const { user, userRoles } = useAuth() // Get current user from auth context

  // Compose a dashboardUser with a role property for UniversalDashboard
  const dashboardUser: CustomUserType | null = user && userRoles.length > 0
    ? {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        role: userRoles[0] as UserRole,
        isActive: !!user.email_confirmed_at,
        createdAt: new Date(user.created_at),
        updatedAt: new Date(user.updated_at || user.created_at)
      }
    : null

  return (
    <Routes>
      {/* Admin Routes - Keep existing admin routes for backward compatibility */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedAdminRoute>
            <AdminDashboard />
          </ProtectedAdminRoute>
        }
      />

      {/* Universal Dashboard Route - New modular dashboard */}
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute>
            <div className="min-h-screen">
              {dashboardUser && <UniversalDashboard user={dashboardUser} />}
            </div>
          </ProtectedRoute>
        }
      />

      {/* Unauthorized Access Route */}
      <Route
        path="/unauthorized"
        element={
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Unauthorized Access</h1>
                <p className="text-gray-600">You don't have permission to access this resource.</p>
              </div>
            </main>
            <Footer />
          </div>
        }
      />

      {/* Public Routes */}
      <Route path="/*" element={
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/services" element={<Services />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/testimonials" element={<Testimonials />} />
              <Route path="/book-class" element={<BookClass />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/learning" element={<Learning />} />
              <Route path="/learning/:id" element={<ArticleView />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route path="/instructor/:instructorId" element={<InstructorProfile />} />
              <Route path="*" element={<NotFound />} />
              <Route path="/book/individual" element={<BookOneOnOne />} />
              <Route path="/book/corporate" element={<BookCorporate />} />
            </Routes>
          </main>
          <Footer />
        </div>
      } />
    </Routes>
  )
}

export default App