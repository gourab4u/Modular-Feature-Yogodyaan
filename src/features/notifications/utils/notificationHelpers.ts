import { supabase } from '../../../shared/lib/supabase'

export async function createNotification({
    userId,
    type,
    title,
    message,
    data = {}
}: {
    userId: string
    type: string
    title: string
    message: string
    data?: Record<string, any>
}) {
    try {
        const { error } = await supabase
            .from('notifications')
            .insert([{
                user_id: userId,
                type,
                title,
                message,
                data,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])

        if (error) throw error
        console.log('Notification created successfully')
    } catch (error) {
        console.error('Error creating notification:', error)
    }
}

// Pre-built notification templates
export const notificationTemplates = {
    articleApproved: (articleTitle: string) => ({
        type: 'article_approved',
        title: 'Article Approved! 🎉',
        message: `Your article "${articleTitle}" has been approved and published.`
    }),

    articleRejected: (articleTitle: string, reason?: string) => ({
        type: 'article_rejected',
        title: 'Article Needs Revision',
        message: `Your article "${articleTitle}" needs some changes. ${reason ? `Reason: ${reason}` : 'Please check the feedback.'}`
    }),

    classBooked: (className: string, date: string) => ({
        type: 'class_booked',
        title: 'Class Booked Successfully',
        message: `You've successfully booked "${className}" for ${date}.`
    }),

    classReminder: (className: string, time: string) => ({
        type: 'class_reminder',
        title: 'Class Reminder',
        message: `Your class "${className}" starts in ${time}.`
    })
}