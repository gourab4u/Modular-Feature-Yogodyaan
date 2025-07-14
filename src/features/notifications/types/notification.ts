export interface Notification {
    id: string
    user_id: string
    type: 'article_approved' | 'article_rejected' | 'class_booked' | 'class_cancelled' | 'class_reminder' | 'system'
    title: string
    message: string
    data?: Record<string, any>
    read: boolean
    created_at: string
    updated_at: string
}

export interface NotificationContextType {
    notifications: Notification[]
    unreadCount: number
    loading: boolean
    markAsRead: (id: string) => Promise<void>
    markAllAsRead: () => Promise<void>
    deleteNotification: (id: string) => Promise<void>
    refreshNotifications: () => Promise<void>
}