import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '../../../shared/lib/supabase'
import { useAuth } from '../../auth/contexts/AuthContext'
import { Notification, NotificationContextType } from '../types/notification'

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

interface NotificationProviderProps {
    children: ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
    const { user } = useAuth()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(false)

    const fetchNotifications = async () => {
        if (!user?.id) return

        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50)

            if (error) throw error
            setNotifications(data || [])
        } catch (error) {
            console.error('Error fetching notifications:', error)
        } finally {
            setLoading(false)
        }
    }

    const markAsRead = async (id: string) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true, updated_at: new Date().toISOString() })
                .eq('id', id)
                .eq('user_id', user?.id)

            if (error) throw error

            setNotifications(prev =>
                prev.map(notif =>
                    notif.id === id ? { ...notif, read: true } : notif
                )
            )
        } catch (error) {
            console.error('Error marking notification as read:', error)
        }
    }

    const markAllAsRead = async () => {
        if (!user?.id) return

        try {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true, updated_at: new Date().toISOString() })
                .eq('user_id', user.id)
                .eq('read', false)

            if (error) throw error

            setNotifications(prev =>
                prev.map(notif => ({ ...notif, read: true }))
            )
        } catch (error) {
            console.error('Error marking all notifications as read:', error)
        }
    }

    const deleteNotification = async (id: string) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', id)
                .eq('user_id', user?.id)

            if (error) throw error

            setNotifications(prev => prev.filter(notif => notif.id !== id))
        } catch (error) {
            console.error('Error deleting notification:', error)
        }
    }

    const refreshNotifications = async () => {
        await fetchNotifications()
    }

    // Subscribe to real-time notifications
    useEffect(() => {
        if (!user?.id) return

        fetchNotifications()

        const channel = supabase
            .channel('notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    setNotifications(prev => [payload.new as Notification, ...prev])
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    setNotifications(prev =>
                        prev.map(notif =>
                            notif.id === payload.new.id ? payload.new as Notification : notif
                        )
                    )
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    setNotifications(prev =>
                        prev.filter(notif => notif.id !== payload.old.id)
                    )
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user?.id])

    const unreadCount = notifications.filter(n => !n.read).length

    const value: NotificationContextType = {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshNotifications
    }

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    )
}

export function useNotifications() {
    const context = useContext(NotificationContext)
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider')
    }
    return context
}