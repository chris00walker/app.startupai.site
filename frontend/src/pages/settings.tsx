/**
 * Settings Page
 *
 * @story US-AS01, US-AS02, US-AS03, US-AS04, US-AS05, US-F04, US-F05, US-C05, US-C06, US-N03
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
  Users
} from "lucide-react"
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
  twoFactorAuth: boolean
  sessionTimeout: string
  apiKeyVisible: boolean
  lastPasswordChange: string
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
        .select('full_name, email, company, role')
        .eq('id', user.id)
        .single()

      if (data) {
        setUserProfile({
          name: data.full_name || '',
          email: data.email || user.email || '',
          company: data.company || '',
          role: data.role || '',
          timezone: "America/New_York",
          language: "English",
          bio: ""
        })
      }
      setIsLoading(false)
    }

    fetchUserProfile()
  }, [user])

  // Demo notification settings
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    workflowUpdates: true,
    clientUpdates: true,
    systemAlerts: true,
    weeklyReports: false
  })

  // Demo security settings
  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactorAuth: true,
    sessionTimeout: "24h",
    apiKeyVisible: false,
    lastPasswordChange: "2024-11-15"
  })

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

  const handleSaveNotifications = () => {
    console.log('Saving notifications:', notifications)
    // TODO: Implement notification settings save
  }

  const handleSaveSecurity = () => {
    console.log('Saving security settings:', security)
    // TODO: Implement security settings save
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
                <Button onClick={handleSaveNotifications} className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  Save Notification Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4">
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
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {security.twoFactorAuth && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Enabled
                        </Badge>
                      )}
                      <Switch
                        checked={security.twoFactorAuth}
                        onCheckedChange={(checked) => setSecurity({...security, twoFactorAuth: checked})}
                      />
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Session Timeout</Label>
                    <Select value={security.sessionTimeout} onValueChange={(value) => setSecurity({...security, sessionTimeout: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1h">1 hour</SelectItem>
                        <SelectItem value="8h">8 hours</SelectItem>
                        <SelectItem value="24h">24 hours</SelectItem>
                        <SelectItem value="7d">7 days</SelectItem>
                        <SelectItem value="30d">30 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex flex-1 items-center gap-2">
                        <Input
                          type={showApiKey ? "text" : "password"}
                          value={showApiKey ? "sk-1234567890abcdef1234567890abcdef" : "••••••••••••••••••••••••••••••••"}
                          readOnly
                          className="font-mono text-xs sm:text-sm"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="shrink-0"
                          onClick={() => setShowApiKey(!showApiKey)}
                        >
                          {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <Button variant="outline" className="shrink-0">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Regenerate
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Use this API key to integrate with external systems
                    </p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <p className="text-sm text-muted-foreground">
                        Last changed: {security.lastPasswordChange}
                      </p>
                      <Button variant="outline" className="w-full sm:w-auto">
                        Change Password
                      </Button>
                    </div>
                  </div>
                </div>
                <Button onClick={handleSaveSecurity} className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  Save Security Settings
                </Button>
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
                    <Select defaultValue="light">
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
                    <Select defaultValue="vpc">
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
                    <Select defaultValue="5min">
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
                    <Select defaultValue="balanced">
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
                <Button className="w-full">
                  <Save className="mr-2 h-4 w-4" />
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
