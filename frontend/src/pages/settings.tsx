/**
 * Settings Page
 *
 * @story US-AS01, US-AS02, US-AS03, US-AS04, US-AS05, US-F04, US-F05, US-C05, US-C06, US-N03, US-AA01, US-AA02, US-AA03
 */

import React, { useState, useEffect } from 'react'
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  Database,
  Key,
  Globe,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Download,
  Upload,
  Loader2,
  Bot,
  FolderArchive,
  Users,
  Monitor,
  Smartphone,
  Tablet,
  Clock,
  MapPin,
  LogOut
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ProjectsTab } from "@/components/settings/ProjectsTab"
import { ClientsTab } from "@/components/settings/ClientsTab"
import { IntegrationsTab } from "@/components/settings/IntegrationsTab"
import { useAuth, useRoleInfo } from "@/lib/auth/hooks"
import { createClient } from "@/lib/supabase/client"
import type { ApprovalType } from "@/types/crewai"
import { getApprovalTypeInfo } from "@/types/crewai"

interface UserProfile {
  name: string
  email: string
  company: string
  role: string
  timezone: string
  language: string
  bio: string
}

interface NotificationSettings {
  emailNotifications: boolean
  pushNotifications: boolean
  workflowUpdates: boolean
  clientUpdates: boolean
  systemAlerts: boolean
  weeklyReports: boolean
}

interface SecuritySettings {
  twoFactorEnabled: boolean
  sessionTimeout: string
  apiKeyVisible: boolean
  lastPasswordChange: string
}

interface TwoFactorStatus {
  enabled: boolean
  factorId?: string
  enrolledAt?: string
}

interface LoginHistoryEntry {
  id: string
  login_method: string
  ip_address: string
  browser: string
  operating_system: string
  device_type: string
  created_at: string
  success: boolean
}

interface SessionEntry {
  id: string
  deviceName: string
  browser: string
  operatingSystem: string
  deviceType: string
  ipAddress: string
  isCurrent: boolean
  lastActiveAt: string
  createdAt: string
}

interface ApprovalSettings {
  autoApproveTypes: ApprovalType[]
  maxAutoApproveSpend: number
  autoApproveLowRisk: boolean
  notifyEmail: boolean
  notifySms: boolean
  escalationEmail: string
}

// All approval types that can be configured
const ALL_APPROVAL_TYPES: ApprovalType[] = [
  'segment_pivot',
  'value_pivot',
  'feature_downgrade',
  'strategic_pivot',
  'spend_increase',
  'campaign_launch',
  'customer_contact',
  'gate_progression',
  'data_sharing',
]

export default function SettingsPage() {
  const { user } = useAuth()
  const { role } = useRoleInfo()
  const [activeTab, setActiveTab] = useState("profile")
  const [showApiKey, setShowApiKey] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // User profile data - loaded from Supabase
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: "",
    email: "",
    company: "",
    role: "",
    timezone: "America/New_York",
    language: "English",
    bio: ""
  })

  // Fetch real user profile from Supabase
  useEffect(() => {
    async function fetchUserProfile() {
      if (!user) {
        setIsLoading(false)
        return
      }

      const supabase = createClient()
      const { data, error } = await supabase
        .from('user_profiles')
        .select('full_name, email, company, role, timezone, language, bio')
        .eq('id', user.id)
        .single()

      if (data) {
        setUserProfile({
          name: data.full_name || '',
          email: data.email || user.email || '',
          company: data.company || '',
          role: data.role || '',
          timezone: data.timezone || 'America/New_York',
          language: data.language || 'English',
          bio: data.bio || ''
        })
      }
      setIsLoading(false)
    }

    fetchUserProfile()
  }, [user])

  // Notification settings - loaded from API
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    workflowUpdates: true,
    clientUpdates: true,
    systemAlerts: true,
    weeklyReports: false
  })
  const [notificationsLoading, setNotificationsLoading] = useState(false)

  // Fetch notification preferences
  useEffect(() => {
    async function fetchNotificationPreferences() {
      if (!user) return

      try {
        const response = await fetch('/api/settings/notifications')
        if (response.ok) {
          const data = await response.json()
          setNotifications({
            emailNotifications: data.email_notifications ?? true,
            pushNotifications: data.push_notifications ?? true,
            workflowUpdates: data.workflow_updates ?? true,
            clientUpdates: data.client_updates ?? true,
            systemAlerts: data.system_alerts ?? true,
            weeklyReports: data.weekly_reports ?? false,
          })
        }
      } catch (error) {
        console.error('Error fetching notification preferences:', error)
      }
    }

    fetchNotificationPreferences()
  }, [user])

  // Security settings - loaded from APIs
  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    sessionTimeout: "24h",
    apiKeyVisible: false,
    lastPasswordChange: "Not available"
  })
  const [twoFactorStatus, setTwoFactorStatus] = useState<TwoFactorStatus>({ enabled: false })
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([])
  const [sessions, setSessions] = useState<SessionEntry[]>([])
  const [securityLoading, setSecurityLoading] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showTwoFactorDialog, setShowTwoFactorDialog] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  // Platform preferences - loaded from API
  const [preferences, setPreferences] = useState({
    theme: 'light',
    defaultCanvasType: 'vpc',
    autoSaveInterval: '5min',
    aiAssistanceLevel: 'balanced',
  })
  const [preferencesLoading, setPreferencesLoading] = useState(false)

  // Fetch platform preferences
  useEffect(() => {
    async function fetchPlatformPreferences() {
      if (!user) return

      try {
        const response = await fetch('/api/settings/preferences')
        if (response.ok) {
          const data = await response.json()
          setPreferences({
            theme: data.theme || 'light',
            defaultCanvasType: data.default_canvas_type || 'vpc',
            autoSaveInterval: data.auto_save_interval || '5min',
            aiAssistanceLevel: data.ai_assistance_level || 'balanced',
          })
        }
      } catch (error) {
        console.error('Error fetching platform preferences:', error)
      }
    }

    fetchPlatformPreferences()
  }, [user])

  // Fetch security data (2FA status, login history, sessions)
  useEffect(() => {
    async function fetchSecurityData() {
      if (!user) return
      setSecurityLoading(true)

      try {
        // Fetch 2FA status
        const twoFaResponse = await fetch('/api/settings/security/2fa')
        if (twoFaResponse.ok) {
          const twoFaData = await twoFaResponse.json()
          setTwoFactorStatus({
            enabled: twoFaData.enabled,
            factorId: twoFaData.factorId,
            enrolledAt: twoFaData.enrolledAt,
          })
          setSecurity(prev => ({ ...prev, twoFactorEnabled: twoFaData.enabled }))
        }

        // Fetch login history
        const historyResponse = await fetch('/api/settings/security/login-history?limit=5')
        if (historyResponse.ok) {
          const historyData = await historyResponse.json()
          setLoginHistory(historyData.history || [])
        }

        // Fetch active sessions
        const sessionsResponse = await fetch('/api/settings/security/sessions')
        if (sessionsResponse.ok) {
          const sessionsData = await sessionsResponse.json()
          setSessions(sessionsData.sessions || [])
        }
      } catch (error) {
        console.error('Error fetching security data:', error)
      } finally {
        setSecurityLoading(false)
      }
    }

    fetchSecurityData()
  }, [user])

  // Approval settings
  const [approvalSettings, setApprovalSettings] = useState<ApprovalSettings>({
    autoApproveTypes: [],
    maxAutoApproveSpend: 0,
    autoApproveLowRisk: false,
    notifyEmail: true,
    notifySms: false,
    escalationEmail: ""
  })
  const [approvalSettingsLoading, setApprovalSettingsLoading] = useState(false)

  const handleSaveProfile = async () => {
    if (!user) return

    console.log('Saving profile:', userProfile)
    const supabase = createClient()

    const { error } = await supabase
      .from('user_profiles')
      .update({
        full_name: userProfile.name,
        company: userProfile.company,
        timezone: userProfile.timezone,
        language: userProfile.language,
        bio: userProfile.bio,
        // email and role are read-only, managed by auth
      })
      .eq('id', user.id)

    if (error) {
      console.error('Error saving profile:', error)
      alert('Error saving profile: ' + error.message)
    } else {
      alert('Profile saved successfully!')
    }
  }

  const handleSaveNotifications = async () => {
    if (!user) return

    setNotificationsLoading(true)
    try {
      const response = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_notifications: notifications.emailNotifications,
          push_notifications: notifications.pushNotifications,
          workflow_updates: notifications.workflowUpdates,
          client_updates: notifications.clientUpdates,
          system_alerts: notifications.systemAlerts,
          weekly_reports: notifications.weeklyReports,
        })
      })

      if (response.ok) {
        alert('Notification settings saved successfully!')
      } else {
        const error = await response.json()
        alert('Error saving notification settings: ' + (error.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error saving notification settings:', error)
      alert('Error saving notification settings')
    } finally {
      setNotificationsLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }

    setPasswordError('')
    setSecurityLoading(true)

    try {
      const response = await fetch('/api/settings/security/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setPasswordError(data.error || 'Failed to change password')
        return
      }

      setPasswordSuccess(true)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => {
        setShowPasswordDialog(false)
        setPasswordSuccess(false)
      }, 2000)
    } catch (error) {
      setPasswordError('Network error. Please try again.')
    } finally {
      setSecurityLoading(false)
    }
  }

  const handleRevokeAllSessions = async () => {
    if (!confirm('This will sign you out from all devices. Continue?')) {
      return
    }

    setSecurityLoading(true)
    try {
      const response = await fetch('/api/settings/security/sessions', {
        method: 'DELETE',
      })

      if (response.ok) {
        // User will be signed out, redirect to login
        window.location.href = '/auth/login'
      } else {
        alert('Failed to revoke sessions')
      }
    } catch (error) {
      alert('Network error. Please try again.')
    } finally {
      setSecurityLoading(false)
    }
  }

  const handleSavePreferences = async () => {
    if (!user) return

    setPreferencesLoading(true)
    try {
      const response = await fetch('/api/settings/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: preferences.theme,
          default_canvas_type: preferences.defaultCanvasType,
          auto_save_interval: preferences.autoSaveInterval,
          ai_assistance_level: preferences.aiAssistanceLevel,
        })
      })

      if (response.ok) {
        alert('Preferences saved successfully!')
      } else {
        const error = await response.json()
        alert('Error saving preferences: ' + (error.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
      alert('Error saving preferences')
    } finally {
      setPreferencesLoading(false)
    }
  }

  // Fetch approval settings
  useEffect(() => {
    async function fetchApprovalSettings() {
      if (!user) return

      try {
        setApprovalSettingsLoading(true)
        const response = await fetch('/api/settings/approvals')

        if (response.ok) {
          const data = await response.json()
          setApprovalSettings({
            autoApproveTypes: data.auto_approve_types || [],
            maxAutoApproveSpend: data.max_auto_approve_spend || 0,
            autoApproveLowRisk: data.auto_approve_low_risk || false,
            notifyEmail: data.notify_email ?? true,
            notifySms: data.notify_sms || false,
            escalationEmail: data.escalation_email || ""
          })
        }
      } catch (error) {
        console.error('Error fetching approval settings:', error)
      } finally {
        setApprovalSettingsLoading(false)
      }
    }

    fetchApprovalSettings()
  }, [user])

  const handleSaveApprovalSettings = async () => {
    if (!user) return

    setApprovalSettingsLoading(true)
    try {
      const response = await fetch('/api/settings/approvals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auto_approve_types: approvalSettings.autoApproveTypes,
          max_auto_approve_spend: approvalSettings.maxAutoApproveSpend,
          auto_approve_low_risk: approvalSettings.autoApproveLowRisk,
          notify_email: approvalSettings.notifyEmail,
          notify_sms: approvalSettings.notifySms,
          escalation_email: approvalSettings.escalationEmail || null
        })
      })

      if (response.ok) {
        alert('Approval settings saved successfully!')
      } else {
        const error = await response.json()
        alert('Error saving approval settings: ' + (error.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error saving approval settings:', error)
      alert('Error saving approval settings')
    } finally {
      setApprovalSettingsLoading(false)
    }
  }

  const toggleApprovalType = (type: ApprovalType) => {
    setApprovalSettings(prev => ({
      ...prev,
      autoApproveTypes: prev.autoApproveTypes.includes(type)
        ? prev.autoApproveTypes.filter(t => t !== type)
        : [...prev.autoApproveTypes, type]
    }))
  }

  if (isLoading) {
    return (
      <DashboardLayout
        breadcrumbs={[
          { title: "Settings", href: "/settings" },
        ]}
      >
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading your settings...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      breadcrumbs={[
        { title: "Settings", href: "/settings" },
      ]}
    >
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg shrink-0">
              <Settings className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Manage your account, preferences, and platform configuration
              </p>
            </div>
          </div>
          <div className="flex items-center">
            <Button variant="outline" size="sm" className="sm:size-default">
              <Download className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Export Settings</span>
              <span className="sm:hidden">Export</span>
            </Button>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          {/*
            Responsive strategy - flex at all breakpoints:
            - Mobile (<640px): Icons only with title tooltips, equal width
            - Tablet (640px-1024px): Icons + abbreviated text, equal width
            - Desktop (1024px+): Full text labels, equal width
          */}
          <TabsList className="flex w-full h-auto gap-1 p-1">
            <TabsTrigger
              value="profile"
              className="flex-1 px-2 py-2 text-xs sm:text-sm"
              title="Profile"
            >
              <User className="h-4 w-4 sm:mr-1.5 lg:hidden" />
              <span className="hidden sm:inline lg:hidden">Profile</span>
              <span className="hidden lg:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex-1 px-2 py-2 text-xs sm:text-sm"
              title="Notifications"
            >
              <Bell className="h-4 w-4 sm:mr-1.5 lg:hidden" />
              <span className="hidden sm:inline lg:hidden">Alerts</span>
              <span className="hidden lg:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="flex-1 px-2 py-2 text-xs sm:text-sm"
              title="Security"
            >
              <Shield className="h-4 w-4 sm:mr-1.5 lg:hidden" />
              <span className="hidden sm:inline lg:hidden">Security</span>
              <span className="hidden lg:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger
              value="preferences"
              className="flex-1 px-2 py-2 text-xs sm:text-sm"
              title="Preferences"
            >
              <Palette className="h-4 w-4 sm:mr-1.5 lg:hidden" />
              <span className="hidden sm:inline lg:hidden">Prefs</span>
              <span className="hidden lg:inline">Preferences</span>
            </TabsTrigger>
            <TabsTrigger
              value="approvals"
              className="flex-1 px-2 py-2 text-xs sm:text-sm"
              title="AI Approvals"
            >
              <Bot className="h-4 w-4 sm:mr-1.5 lg:hidden" />
              <span className="hidden sm:inline lg:hidden">AI</span>
              <span className="hidden lg:inline">AI Approvals</span>
            </TabsTrigger>
            {role === 'founder' && (
              <TabsTrigger
                value="projects"
                className="flex-1 px-2 py-2 text-xs sm:text-sm"
                title="Projects"
              >
                <FolderArchive className="h-4 w-4 sm:mr-1.5 lg:hidden" />
                <span className="hidden sm:inline lg:hidden">Projects</span>
                <span className="hidden lg:inline">Projects</span>
              </TabsTrigger>
            )}
            {role === 'consultant' && (
              <TabsTrigger
                value="clients"
                className="flex-1 px-2 py-2 text-xs sm:text-sm"
                title="Clients"
              >
                <Users className="h-4 w-4 sm:mr-1.5 lg:hidden" />
                <span className="hidden sm:inline lg:hidden">Clients</span>
                <span className="hidden lg:inline">Clients</span>
              </TabsTrigger>
            )}
            <TabsTrigger
              value="integrations"
              className="flex-1 px-2 py-2 text-xs sm:text-sm"
              title="Integrations"
            >
              <Globe className="h-4 w-4 sm:mr-1.5 lg:hidden" />
              <span className="hidden sm:inline lg:hidden">Integrate</span>
              <span className="hidden lg:inline">Integrations</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Profile Information</span>
                </CardTitle>
                <CardDescription>
                  Update your personal information and professional details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={userProfile.name}
                      onChange={(e) => setUserProfile({...userProfile, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userProfile.email}
                      onChange={(e) => setUserProfile({...userProfile, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={userProfile.company}
                      onChange={(e) => setUserProfile({...userProfile, company: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input
                      id="role"
                      value={userProfile.role}
                      onChange={(e) => setUserProfile({...userProfile, role: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={userProfile.timezone} onValueChange={(value) => setUserProfile({...userProfile, timezone: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                        <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                        <SelectItem value="Europe/London">London (GMT)</SelectItem>
                        <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select value={userProfile.language} onValueChange={(value) => setUserProfile({...userProfile, language: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Spanish">Spanish</SelectItem>
                        <SelectItem value="French">French</SelectItem>
                        <SelectItem value="German">German</SelectItem>
                        <SelectItem value="Portuguese">Portuguese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself and your expertise..."
                    value={userProfile.bio}
                    onChange={(e) => setUserProfile({...userProfile, bio: e.target.value})}
                    rows={3}
                  />
                </div>
                <Button onClick={handleSaveProfile} className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  Save Profile Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Notification Preferences</span>
                </CardTitle>
                <CardDescription>
                  Configure how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={notifications.emailNotifications}
                      onCheckedChange={(checked) => setNotifications({...notifications, emailNotifications: checked})}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
                    </div>
                    <Switch
                      checked={notifications.pushNotifications}
                      onCheckedChange={(checked) => setNotifications({...notifications, pushNotifications: checked})}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Workflow Updates</Label>
                      <p className="text-sm text-muted-foreground">Get notified when AI workflows complete</p>
                    </div>
                    <Switch
                      checked={notifications.workflowUpdates}
                      onCheckedChange={(checked) => setNotifications({...notifications, workflowUpdates: checked})}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Client Updates</Label>
                      <p className="text-sm text-muted-foreground">Notifications about client project changes</p>
                    </div>
                    <Switch
                      checked={notifications.clientUpdates}
                      onCheckedChange={(checked) => setNotifications({...notifications, clientUpdates: checked})}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>System Alerts</Label>
                      <p className="text-sm text-muted-foreground">Important system and security alerts</p>
                    </div>
                    <Switch
                      checked={notifications.systemAlerts}
                      onCheckedChange={(checked) => setNotifications({...notifications, systemAlerts: checked})}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Weekly Reports</Label>
                      <p className="text-sm text-muted-foreground">Weekly summary of platform activity</p>
                    </div>
                    <Switch
                      checked={notifications.weeklyReports}
                      onCheckedChange={(checked) => setNotifications({...notifications, weeklyReports: checked})}
                    />
                  </div>
                </div>
                <Button onClick={handleSaveNotifications} disabled={notificationsLoading} className="w-full">
                  {notificationsLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Notification Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4">
            {/* Password & 2FA Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Security Settings</span>
                </CardTitle>
                <CardDescription>
                  Manage your account security and authentication
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {/* Two-Factor Authentication */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {twoFactorStatus.enabled ? (
                        <>
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Enabled
                          </Badge>
                          <Button variant="outline" size="sm" onClick={() => setShowTwoFactorDialog(true)}>
                            Manage
                          </Button>
                        </>
                      ) : (
                        <Button onClick={() => setShowTwoFactorDialog(true)}>
                          Enable 2FA
                        </Button>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Password Change */}
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <p className="text-sm text-muted-foreground">
                        Change your account password
                      </p>
                      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full sm:w-auto">
                            <Key className="mr-2 h-4 w-4" />
                            Change Password
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Change Password</DialogTitle>
                            <DialogDescription>
                              Enter your current password and choose a new one.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            {passwordError && (
                              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                                {passwordError}
                              </div>
                            )}
                            {passwordSuccess && (
                              <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                                Password changed successfully!
                              </div>
                            )}
                            <div className="space-y-2">
                              <Label htmlFor="currentPassword">Current Password</Label>
                              <Input
                                id="currentPassword"
                                type="password"
                                value={passwordForm.currentPassword}
                                onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="newPassword">New Password</Label>
                              <Input
                                id="newPassword"
                                type="password"
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                              />
                              <p className="text-xs text-muted-foreground">
                                Must be at least 8 characters with uppercase, number, and special character.
                              </p>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="confirmPassword">Confirm New Password</Label>
                              <Input
                                id="confirmPassword"
                                type="password"
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleChangePassword} disabled={securityLoading}>
                              {securityLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="mr-2 h-4 w-4" />
                              )}
                              Change Password
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Sessions Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Monitor className="h-5 w-5" />
                  <span>Active Sessions</span>
                </CardTitle>
                <CardDescription>
                  Devices where you&apos;re currently signed in
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {securityLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : sessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No active sessions found
                  </p>
                ) : (
                  <>
                    <div className="space-y-3">
                      {sessions.map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            {session.deviceType === 'mobile' ? (
                              <Smartphone className="h-5 w-5 text-muted-foreground" />
                            ) : session.deviceType === 'tablet' ? (
                              <Tablet className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <Monitor className="h-5 w-5 text-muted-foreground" />
                            )}
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-sm">{session.deviceName}</span>
                                {session.isCurrent && (
                                  <Badge variant="secondary" className="text-xs">This device</Badge>
                                )}
                              </div>
                              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{new Date(session.lastActiveAt).toLocaleString()}</span>
                                {session.ipAddress && (
                                  <>
                                    <span>•</span>
                                    <span>{session.ipAddress}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={handleRevokeAllSessions}
                      disabled={securityLoading}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out All Devices
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Login History Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Recent Login History</span>
                </CardTitle>
                <CardDescription>
                  Your recent sign-in activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                {securityLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : loginHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No login history available
                  </p>
                ) : (
                  <div className="space-y-2">
                    {loginHistory.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${entry.success ? 'bg-green-500' : 'bg-red-500'}`} />
                          <div>
                            <div className="text-sm font-medium">
                              {entry.browser || 'Unknown Browser'} on {entry.operating_system || 'Unknown OS'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {entry.ip_address} • {new Date(entry.created_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <Badge variant={entry.login_method === 'password' ? 'outline' : 'secondary'}>
                          {entry.login_method}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="h-5 w-5" />
                  <span>Platform Preferences</span>
                </CardTitle>
                <CardDescription>
                  Customize your platform experience and workflow settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Theme</Label>
                    <Select value={preferences.theme} onValueChange={(value) => setPreferences({...preferences, theme: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Default Canvas Type</Label>
                    <Select value={preferences.defaultCanvasType} onValueChange={(value) => setPreferences({...preferences, defaultCanvasType: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vpc">Value Proposition Canvas</SelectItem>
                        <SelectItem value="bmc">Business Model Canvas</SelectItem>
                        <SelectItem value="tbi">Testing Business Ideas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Auto-save Interval</Label>
                    <Select value={preferences.autoSaveInterval} onValueChange={(value) => setPreferences({...preferences, autoSaveInterval: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1min">1 minute</SelectItem>
                        <SelectItem value="5min">5 minutes</SelectItem>
                        <SelectItem value="10min">10 minutes</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>AI Assistance Level</Label>
                    <Select value={preferences.aiAssistanceLevel} onValueChange={(value) => setPreferences({...preferences, aiAssistanceLevel: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minimal">Minimal</SelectItem>
                        <SelectItem value="balanced">Balanced</SelectItem>
                        <SelectItem value="aggressive">Aggressive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleSavePreferences} disabled={preferencesLoading} className="w-full">
                  {preferencesLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Approvals Tab */}
          <TabsContent value="approvals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bot className="h-5 w-5" />
                  <span>AI Approval Settings</span>
                </CardTitle>
                <CardDescription>
                  Configure how AI recommendations are auto-approved or require your review
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Auto-approve low risk */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-approve low-risk decisions</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically approve decisions marked as low risk by AI
                    </p>
                  </div>
                  <Switch
                    checked={approvalSettings.autoApproveLowRisk}
                    onCheckedChange={(checked) =>
                      setApprovalSettings({ ...approvalSettings, autoApproveLowRisk: checked })
                    }
                  />
                </div>
                <Separator />

                {/* Auto-approve by type */}
                <div className="space-y-4">
                  <div className="space-y-0.5">
                    <Label>Auto-approve by type</Label>
                    <p className="text-sm text-muted-foreground">
                      Select which approval types should be automatically approved
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {ALL_APPROVAL_TYPES.map((type) => {
                      const typeInfo = getApprovalTypeInfo(type)
                      return (
                        <div
                          key={type}
                          className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                          onClick={() => toggleApprovalType(type)}
                        >
                          <Checkbox
                            id={type}
                            checked={approvalSettings.autoApproveTypes.includes(type)}
                            onCheckedChange={() => toggleApprovalType(type)}
                          />
                          <div className="flex-1 min-w-0">
                            <Label htmlFor={type} className="cursor-pointer font-medium">
                              {typeInfo.label}
                            </Label>
                            <p className="text-xs text-muted-foreground truncate">
                              {typeInfo.description}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <Separator />

                {/* Max auto-approve spend */}
                <div className="space-y-2">
                  <Label htmlFor="maxSpend">Maximum auto-approve spend ($)</Label>
                  <p className="text-sm text-muted-foreground">
                    Auto-approve spend increases up to this amount
                  </p>
                  <Input
                    id="maxSpend"
                    type="number"
                    min={0}
                    value={approvalSettings.maxAutoApproveSpend}
                    onChange={(e) =>
                      setApprovalSettings({
                        ...approvalSettings,
                        maxAutoApproveSpend: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="max-w-xs"
                  />
                </div>
                <Separator />

                {/* Escalation email */}
                <div className="space-y-2">
                  <Label htmlFor="escalationEmail">Escalation email</Label>
                  <p className="text-sm text-muted-foreground">
                    Backup contact for urgent approvals that you miss
                  </p>
                  <Input
                    id="escalationEmail"
                    type="email"
                    placeholder="backup@example.com"
                    value={approvalSettings.escalationEmail}
                    onChange={(e) =>
                      setApprovalSettings({
                        ...approvalSettings,
                        escalationEmail: e.target.value,
                      })
                    }
                    className="max-w-md"
                  />
                </div>
                <Separator />

                {/* Notification preferences */}
                <div className="space-y-4">
                  <Label>Notification Preferences</Label>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Email notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive email for new approval requests
                        </p>
                      </div>
                      <Switch
                        checked={approvalSettings.notifyEmail}
                        onCheckedChange={(checked) =>
                          setApprovalSettings({ ...approvalSettings, notifyEmail: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>SMS notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive SMS for urgent approvals
                        </p>
                      </div>
                      <Switch
                        checked={approvalSettings.notifySms}
                        onCheckedChange={(checked) =>
                          setApprovalSettings({ ...approvalSettings, notifySms: checked })
                        }
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSaveApprovalSettings}
                  disabled={approvalSettingsLoading}
                  className="w-full"
                >
                  {approvalSettingsLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Approval Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Projects Tab (Founders Only) */}
          {role === 'founder' && (
            <TabsContent value="projects" className="space-y-4">
              <ProjectsTab />
            </TabsContent>
          )}

          {/* Clients Tab (Consultants Only) */}
          {role === 'consultant' && (
            <TabsContent value="clients" className="space-y-4">
              <ClientsTab />
            </TabsContent>
          )}

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-4">
            <IntegrationsTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
