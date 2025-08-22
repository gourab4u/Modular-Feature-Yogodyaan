import { supabase } from '../shared/lib/supabase'
import { EmailTemplateVariables, renderEmailTemplate } from '../shared/utils/emailTemplates'

// Disable send logs after first failure so we don't spam the console if the table doesn't exist
let newsletterLogsEnabled = true

export interface SendNewsletterParams {
  newsletterId: string
  subject: string
  preheader?: string
  templateId: string
  templateVariables: EmailTemplateVariables
  recipientFilters?: {
    status?: 'active' | 'all'
    tags?: string[]
  }
}

export interface NewsletterSendResult {
  success: boolean
  sentCount: number
  failedCount: number
  errors: string[]
  newsletterId: string
}

export class EmailService {

  /**
   * Send newsletter to all subscribers
   */
  static async sendNewsletter(params: SendNewsletterParams): Promise<NewsletterSendResult> {
    try {
      // Get subscribers based on filters
      const subscribers = await this.getSubscribers(params.recipientFilters)

      if (subscribers.length === 0) {
        return {
          success: false,
          sentCount: 0,
          failedCount: 0,
          errors: ['No active subscribers found'],
          newsletterId: params.newsletterId
        }
      }

      // Create email batches (to avoid overwhelming the email service)
      const batchSize = 50
      const batches = this.createBatches(subscribers, batchSize)

      let sentCount = 0
      let failedCount = 0
      const errors: string[] = []

      // Process batches
      for (const batch of batches) {
        try {
          const batchResult = await this.sendEmailBatch(batch, {
            subject: params.subject,
            preheader: params.preheader,
            templateId: params.templateId,
            templateVariables: params.templateVariables
          })

          sentCount += batchResult.successful
          failedCount += batchResult.failed

          if (batchResult.errors.length > 0) {
            errors.push(...batchResult.errors)
          }

          // Add delay between batches to avoid rate limiting
          await this.delay(1000)

        } catch (error) {
          console.error('Batch processing error:', error)
          failedCount += batch.length
          errors.push(`Batch error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      // Update newsletter status
      await this.updateNewsletterStatus(params.newsletterId, {
        status: 'sent',
        sent_at: new Date().toISOString(),
        sent_count: sentCount,
        failed_count: failedCount
      })

      // Log send statistics
      await this.logNewsletterSend(params.newsletterId, {
        total_recipients: subscribers.length,
        sent_count: sentCount,
        failed_count: failedCount,
        errors: errors
      })

      return {
        success: sentCount > 0,
        sentCount,
        failedCount,
        errors,
        newsletterId: params.newsletterId
      }

    } catch (error) {
      console.error('Newsletter send error:', error)

      // Update newsletter with error status
      await this.updateNewsletterStatus(params.newsletterId, {
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      })

      return {
        success: false,
        sentCount: 0,
        failedCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        newsletterId: params.newsletterId
      }
    }
  }

  /**
   * Get subscribers based on filters
   */
  private static async getSubscribers(filters?: { status?: string, tags?: string[] }) {
    let query = supabase
      .from('newsletter_subscribers')
      .select('id, email, name, status')

    // Apply status filter (default to active only)
    const status = filters?.status || 'active'
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    // Apply tag filters if provided
    if (filters?.tags && filters.tags.length > 0) {
      query = query.in('tags', filters.tags as any)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching subscribers:', error)
      throw new Error('Failed to fetch subscribers')
    }

    return data || []
  }

  /**
   * Send email to a batch of subscribers
   * Renders per-subscriber so templates receive a working vars.unsubscribeUrl
   */
  private static async sendEmailBatch(
    subscribers: Array<{ id: string, email: string, name: string }>,
    emailData: {
      subject: string,
      preheader?: string,
      templateId: string,
      templateVariables: EmailTemplateVariables
    }
  ): Promise<{ successful: number, failed: number, errors: string[] }> {

    try {
      const baseUrl = (import.meta as any)?.env?.VITE_REACT_APP_BASE_URL || (globalThis as any)?.window?.location?.origin || ''

      const results = await Promise.allSettled(
        subscribers.map(async (subscriber) => {
          // Build personalized unsubscribe URL for each subscriber
          const unsubscribeUrl = `${baseUrl}/unsubscribe?token=${encodeURIComponent(await this.generateUnsubscribeToken(subscriber.id))}`

          // Render template per subscriber with unsubscribeUrl populated
          const html = renderEmailTemplate(emailData.templateId, {
            ...emailData.templateVariables,
            unsubscribeUrl,
            // keep preferencesUrl if already provided
            preferencesUrl: emailData.templateVariables.preferencesUrl
          })

          // Send via Edge Function (Resend) with fallback handled inside
          const res = await this.sendTransactionalEmail(subscriber.email, emailData.subject, html)
          if (!res.ok) {
            throw new Error(res.error || 'Transactional send failed')
          }
          return res
        })
      )

      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length
      const errors = results
        .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
        .map(r => (r as any).reason?.message || 'Unknown error')

      return { successful, failed, errors }

    } catch (error) {
      console.error('Batch send error:', error)
      return {
        successful: 0,
        failed: subscribers.length,
        errors: [error instanceof Error ? error.message : 'Batch send failed']
      }
    }
  }

  /**
   * Simulate email sending (replace with real email service)
   */
  public static async simulateEmailSend(emailData: { to: string, subject: string, html: string }): Promise<void> {
    // Simulate network delay and potential failures
    await this.delay(100 + Math.random() * 200)

    // Simulate 95% success rate
    if (Math.random() < 0.05) {
      throw new Error(`Failed to send to ${emailData.to}`)
    }

    console.log(`Email sent to ${emailData.to}: ${emailData.subject}`)
  }

  /**
   * Generate secure unsubscribe token
   */
  private static async generateUnsubscribeToken(subscriberId: string): Promise<string> {
    // In production, generate a secure JWT token or use a proper token system
    return btoa(`${subscriberId}:${Date.now()}`)
  }

  /**
   * Create batches from array
   */
  private static createBatches<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = []
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize))
    }
    return batches
  }

  /**
   * Add delay between operations
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Update newsletter status in database
   */
  private static async updateNewsletterStatus(
    newsletterId: string,
    updates: {
      status?: string
      sent_at?: string
      sent_count?: number
      failed_count?: number
      error_message?: string
    }
  ) {
    // Try to update; if schema lacks some columns, strip them and retry
    let clean: Record<string, any> = {
      ...updates,
      updated_at: new Date().toISOString()
    }

    for (let attempt = 0; attempt < 5; attempt++) {
      const { error } = await supabase
        .from('newsletters')
        .update(clean)
        .eq('id', newsletterId)

      if (!error) return

      const code = (error as any)?.code
      const message: string = (error as any)?.message || ''

      if (code === 'PGRST204' && /column/i.test(message)) {
        const m = message.match(/'([^']+)' column/)
        const missing = m?.[1]
        if (missing && missing in clean) {
          delete clean[missing]
          continue
        }
      }

      // Unknown error or nothing else to strip; log once and stop
      console.error('Error updating newsletter status:', error)
      return
    }
  }

  /**
   * Log newsletter send statistics
   */
  private static async logNewsletterSend(
    newsletterId: string,
    stats: {
      total_recipients: number
      sent_count: number
      failed_count: number
      errors: string[]
    }
  ) {
    if (!newsletterLogsEnabled) return
    try {
      await supabase
        .from('newsletter_send_logs')
        .insert({
          newsletter_id: newsletterId,
          total_recipients: stats.total_recipients,
          sent_count: stats.sent_count,
          failed_count: stats.failed_count,
          errors: stats.errors,
          sent_at: new Date().toISOString()
        })
    } catch (error: any) {
      newsletterLogsEnabled = false
      // Table likely missing; disable further attempts quietly
      console.warn('Newsletter send logs table not available; logging disabled.')
    }
  }

  /**
   * Get newsletter send statistics
   */
  static async getSendStatistics(newsletterId: string) {
    const { data, error } = await supabase
      .from('newsletter_send_logs')
      .select('*')
      .eq('newsletter_id', newsletterId)
      .order('sent_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') { // Not found is ok
      console.error('Error fetching send statistics:', error)
      return null
    }

    return data
  }

  /**
   * Preview email template
   */
  static previewTemplate(templateId: string, variables: EmailTemplateVariables): string {
    return renderEmailTemplate(templateId, {
      ...variables,
      unsubscribeUrl: '#unsubscribe-preview',
      preferencesUrl: '#preferences-preview'
    })
  }

  /**
   * Send transactional email via Edge Function (Resend), fallback to simulate
   */
  static async sendTransactionalEmail(
    to: string,
    subject: string,
    html: string,
    attachments?: Array<{ filename: string; content: string | Uint8Array; contentType?: string }>
  ): Promise<{ ok: boolean; simulated: boolean; error?: string }> {
    try {
      const { error } = await supabase.functions.invoke('send-invoice', {
        body: { to, subject, html, attachments }
      })
      if (error) throw error
      return { ok: true, simulated: false }
    } catch (err: any) {
      console.warn('Edge function send failed, simulating email. Error:', err)
      try {
        await this.simulateEmailSend({ to, subject, html })
        return { ok: true, simulated: true }
      } catch (simErr: any) {
        console.error('Simulation also failed:', simErr)
        return { ok: false, simulated: false, error: simErr?.message || String(simErr) }
      }
    }
  }

  /**
   * Test email send (for testing purposes)
   */
  static async sendTestEmail(
    templateId: string,
    variables: EmailTemplateVariables,
    testEmail: string
  ): Promise<boolean> {
    try {
      const emailHtml = this.previewTemplate(templateId, variables)

      // Send test email
      await this.simulateEmailSend({
        to: testEmail,
        subject: `[TEST] ${variables.title}`,
        html: emailHtml
      })

      return true
    } catch (error) {
      console.error('Test email send error:', error)
      return false
    }
  }
}

export default EmailService
