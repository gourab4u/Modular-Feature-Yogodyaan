// BusinessSettings.tsx
import { useEffect, useState } from 'react'
import { supabase } from '../../../../shared/lib/supabase'

function TextInput({ label, value, onChange }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}

function NumberInput({ label, value, onChange }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="number"
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}

function TextArea({ label, value, onChange }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea
        value={value}
        onChange={onChange}
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}

function ColorInput({ label, value, onChange }: any) {
  return (
    <div className="flex items-center space-x-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
          type="color"
          value={value}
          onChange={onChange}
          className="w-12 h-10 p-0 border border-gray-300 rounded"
        />
      </div>
      <input
        type="text"
        value={value}
        onChange={onChange}
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}

function Section({ title, children }: any) {
  return (
    <div className="bg-white shadow rounded-lg p-5 space-y-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </div>
  )
}

export default function BusinessSettings() {
  const [settings, setSettings] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    setLoading(true)
    const { data, error } = await supabase
      .from('business_settings')
      .select('key, value')
    if (error) {
      console.error(error)
    } else {
      const mapped: any = {}
      data.forEach((row) => {
        mapped[row.key] = row.value
      })
      setSettings(mapped)
    }
    setLoading(false)
  }

  function handleNestedChange(section: string, field: string, value: any) {
    setSettings((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }))
  }

  async function saveSettings() {
    setSaving(true)
    for (const key of Object.keys(settings)) {
      const { error } = await supabase
        .from('business_settings')
        .upsert({
          key,
          value: settings[key],
        }, { onConflict: 'key' })
      if (error) {
        console.error(`Error saving ${key}:`, error)
      }
    }
    setSaving(false)
    alert('Settings saved!')
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-6">
      <h1 className="text-2xl font-bold">Business Settings</h1>

      {/* Business Profile */}
      <Section title="Business Profile">
        <TextInput
          label="Name"
          value={settings.business_profile?.name || ''}
          onChange={(e) => handleNestedChange('business_profile', 'name', e.target.value)}
        />
        <TextInput
          label="Tagline"
          value={settings.business_profile?.tagline || ''}
          onChange={(e) => handleNestedChange('business_profile', 'tagline', e.target.value)}
        />
        <TextInput
          label="Logo URL"
          value={settings.business_profile?.logo_url || ''}
          onChange={(e) => handleNestedChange('business_profile', 'logo_url', e.target.value)}
        />
        <TextInput
          label="Website URL"
          value={settings.business_profile?.website_url || ''}
          onChange={(e) => handleNestedChange('business_profile', 'website_url', e.target.value)}
        />
      </Section>

      {/* Business Contact */}
      <Section title="Business Contact">
        <TextInput
          label="Email"
          value={settings.business_contact?.email || ''}
          onChange={(e) => handleNestedChange('business_contact', 'email', e.target.value)}
        />
        <TextInput
          label="Phone"
          value={settings.business_contact?.phone || ''}
          onChange={(e) => handleNestedChange('business_contact', 'phone', e.target.value)}
        />
        <TextInput
          label="City"
          value={settings.business_contact?.city || ''}
          onChange={(e) => handleNestedChange('business_contact', 'city', e.target.value)}
        />
        <TextInput
          label="State"
          value={settings.business_contact?.state || ''}
          onChange={(e) => handleNestedChange('business_contact', 'state', e.target.value)}
        />
        <TextInput
          label="Country"
          value={settings.business_contact?.country || ''}
          onChange={(e) => handleNestedChange('business_contact', 'country', e.target.value)}
        />
        <TextInput
          label="Postal Code"
          value={settings.business_contact?.postal_code || ''}
          onChange={(e) => handleNestedChange('business_contact', 'postal_code', e.target.value)}
        />
        <TextArea
          label="Address Lines (comma separated)"
          value={settings.business_contact?.address_lines?.join(', ') || ''}
          onChange={(e) => handleNestedChange('business_contact', 'address_lines', e.target.value.split(',').map((s) => s.trim()))}
        />
      </Section>

      {/* Social Links */}
      <Section title="Social Links">
        <TextInput
          label="YouTube"
          value={settings.social_links?.youtube || ''}
          onChange={(e) => handleNestedChange('social_links', 'youtube', e.target.value)}
        />
        <TextInput
          label="LinkedIn"
          value={settings.social_links?.linkedin || ''}
          onChange={(e) => handleNestedChange('social_links', 'linkedin', e.target.value)}
        />
        <TextInput
          label="Instagram"
          value={settings.social_links?.instagram || ''}
          onChange={(e) => handleNestedChange('social_links', 'instagram', e.target.value)}
        />
      </Section>

      {/* Invoice Preferences */}
      <Section title="Invoice Preferences">
        <TextArea
          label="Terms"
          value={settings.invoice_preferences?.terms || ''}
          onChange={(e) => handleNestedChange('invoice_preferences', 'terms', e.target.value)}
        />
        <NumberInput
          label="Tax Rate"
          value={settings.invoice_preferences?.tax_rate || 0}
          onChange={(e) => handleNestedChange('invoice_preferences', 'tax_rate', parseFloat(e.target.value))}
        />
        <TextInput
          label="Time Zone"
          value={settings.invoice_preferences?.time_zone || ''}
          onChange={(e) => handleNestedChange('invoice_preferences', 'time_zone', e.target.value)}
        />
        <ColorInput
          label="Color Primary"
          value={settings.invoice_preferences?.color_primary || '#000000'}
          onChange={(e) => handleNestedChange('invoice_preferences', 'color_primary', e.target.value)}
        />
        <ColorInput
          label="Color Accent"
          value={settings.invoice_preferences?.color_accent || '#000000'}
          onChange={(e) => handleNestedChange('invoice_preferences', 'color_accent', e.target.value)}
        />
        <TextInput
          label="Invoice Prefix"
          value={settings.invoice_preferences?.invoice_number_prefix || ''}
          onChange={(e) => handleNestedChange('invoice_preferences', 'invoice_number_prefix', e.target.value)}
        />
      </Section>

      {/* Legal Disclaimer */}
      <Section title="Legal Disclaimer">
        <TextInput
          label="CIN Number"
          value={settings.legal_disclaimer?.cin_number || ''}
          onChange={(e) => handleNestedChange('legal_disclaimer', 'cin_number', e.target.value)}
        />
        <TextInput
          label="GST Number"
          value={settings.legal_disclaimer?.gst_number || ''}
          onChange={(e) => handleNestedChange('legal_disclaimer', 'gst_number', e.target.value)}
        />
        <TextArea
          label="Disclaimer"
          value={settings.legal_disclaimer?.disclaimer || ''}
          onChange={(e) => handleNestedChange('legal_disclaimer', 'disclaimer', e.target.value)}
        />
      </Section>

      <div className="flex justify-end">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
