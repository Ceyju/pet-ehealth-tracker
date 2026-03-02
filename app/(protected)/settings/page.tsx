'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertCircle, Loader2, LogOut } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const { user, setUser, logout } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    zip_code: user?.zip_code || '',
  })

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update(formData)
        .eq('id', user.id)

      if (updateError) throw updateError

      setUser({ ...user, ...formData })
      setSuccess('Settings saved successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      // Delete all user data
      // vaccinations has no user_id — delete via pet_id
      const { data: userPets } = await supabase.from('pets').select('id').eq('user_id', user.id)
      const petIds = (userPets ?? []).map((p) => p.id).filter(Boolean)
      if (petIds.length > 0) {
        await supabase.from('vaccinations').delete().in('pet_id', petIds)
      }
      await supabase.from('pets').delete().eq('user_id', user.id)
      await supabase.from('medical_records').delete().eq('user_id', user.id)
      await supabase.from('profiles').delete().eq('id', user.id)

      // Delete auth user
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
      if (deleteError) throw deleteError

      await logout()
      router.push('/login')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-red-600">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-[#E0EEC6] border border-[#7CA982] rounded-lg text-[#243E36] text-sm">
          {success}
        </div>
      )}

      {/* Profile Settings */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Information</h2>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <Input
                id="full_name"
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                disabled={saving}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email (Read-only)
              </label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={saving}
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <Input
                id="address"
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                disabled={saving}
              />
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <Input
                id="city"
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                disabled={saving}
              />
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                State/Province
              </label>
              <Input
                id="state"
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                disabled={saving}
              />
            </div>

            <div>
              <label htmlFor="zip_code" className="block text-sm font-medium text-gray-700 mb-2">
                ZIP/Postal Code
              </label>
              <Input
                id="zip_code"
                type="text"
                value={formData.zip_code}
                onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                disabled={saving}
              />
            </div>
          </div>

          <Button
            onClick={handleSave}
            className="bg-[#243E36] hover:bg-[#1a2e28] text-white"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </Card>

      {/* Account Actions */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Account</h2>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Sign out from your account on this device.
            </p>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="text-orange-600 hover:text-orange-700 border-orange-200"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <p className="text-sm text-gray-600 mb-4">
              Permanently delete your account and all associated data. This cannot be undone.
            </p>
            {!showDeleteConfirm ? (
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                variant="outline"
                className="text-red-600 hover:text-red-700 border-red-200"
              >
                Delete Account
              </Button>
            ) : (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-900 font-medium mb-4">
                  Are you sure? This will permanently delete your account, all your pets, vaccinations, and medical records.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleDeleteAccount}
                    className="bg-red-600 hover:bg-red-700 text-white"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Yes, Delete Account'
                    )}
                  </Button>
                  <Button
                    onClick={() => setShowDeleteConfirm(false)}
                    variant="outline"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
