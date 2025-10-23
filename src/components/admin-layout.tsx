'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Users,
  FolderKanban,
  Ticket,
  Settings,
  Menu,
  X,
  LogOut,
  User,
  Search,
  Bell,
  Shield as ShieldIcon,
  CheckSquare,
  Server,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Mail,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Logo from '@/components/logo'
import { toast } from 'sonner'

interface Notification {
  _id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: string
  read: boolean
  actionUrl?: string
}

// Navigation basierend auf Benutzerrolle
const getNavigation = (userRole: string, userType?: string) => {
  const baseNavigation = [
    { name: 'Dashboard', href: '/portal', icon: ShieldIcon, roles: ['MITARBEITER', 'MANAGER', 'ADMIN', 'KUNDE'] },
    { name: 'Kunden', href: '/portal/customers', icon: Users, roles: ['MANAGER', 'ADMIN'] },
    { name: 'Projekte', href: '/portal/projects', icon: FolderKanban, roles: ['MITARBEITER', 'MANAGER', 'ADMIN'] },
    { name: 'Aufgaben', href: '/portal/tasks', icon: CheckSquare, roles: ['MITARBEITER', 'MANAGER', 'ADMIN'] },
    { name: 'Tickets', href: '/portal/tickets', icon: Ticket, roles: ['MITARBEITER', 'MANAGER', 'ADMIN'] },
    { name: 'Mitarbeiter', href: '/portal/users', icon: Users, roles: ['ADMIN'] },
    { name: 'Kunden Benutzer', href: '/portal/consumers', icon: Users, roles: ['MANAGER', 'ADMIN'] },
    { name: 'Audit-Logs', href: '/portal/audit-logs', icon: Activity, roles: ['ADMIN'] },
    { name: 'System', href: '/portal/system', icon: Server, roles: ['ADMIN'] },
    { name: 'E-Mail-Einstellungen', href: '/portal/email-settings', icon: Mail, roles: ['ADMIN'] },
    { name: 'Einstellungen', href: '/portal/settings', icon: Settings, roles: ['ADMIN'] },
  ]

  // Kunde-Benutzer haben eingeschränkte Navigation mit eigenen Seiten
  if (userType === 'CONSUMER') {
    return [
      { name: 'Dashboard', href: '/portal', icon: ShieldIcon, roles: ['KUNDE'] },
      { name: 'Projekte', href: '/portal/consumer-projects', icon: FolderKanban, roles: ['KUNDE'] },
      { name: 'Aufgaben', href: '/portal/consumer-tasks', icon: CheckSquare, roles: ['KUNDE'] },
      { name: 'Tickets', href: '/portal/consumer-tickets', icon: Ticket, roles: ['KUNDE'] },
    ]
  }

  return baseNavigation.filter(item => item.roles.includes(userRole))
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  // Navigation basierend auf Benutzerrolle
  const navigation = session?.user?.role ? getNavigation(session.user.role, (session.user as any).userType) : []

  useEffect(() => {
    fetchNotifications()
    
    // Auto-refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/v1/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/v1/notifications/${notificationId}/read`, {
        method: 'PUT',
      })
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId ? { ...notif, read: true } : notif
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/v1/notifications/read-all', {
        method: 'PUT',
      })
      if (response.ok) {
        setNotifications(prev => prev.map(notif => ({ ...notif, read: true })))
        setUnreadCount(0)
        toast.success('Alle Benachrichtigungen als gelesen markiert')
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Bell className="h-4 w-4 text-blue-600" />
    }
  }

  const formatNotificationTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'gerade eben'
    if (diffInMinutes < 60) return `vor ${diffInMinutes} Min`
    if (diffInMinutes < 1440) return `vor ${Math.floor(diffInMinutes / 60)} Std`
    const diffInDays = Math.floor(diffInMinutes / 1440)
    return `vor ${diffInDays} Tag${diffInDays > 1 ? 'en' : ''}`
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <div className={cn(
        'fixed inset-0 z-50 lg:hidden',
        sidebarOpen ? 'block' : 'hidden'
      )}>
        <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
        <div className="fixed left-0 top-0 h-full w-64 bg-card border-r">
          <div className="flex h-full flex-col">
            <div className="flex h-20 items-center justify-between px-4">
              <div className="flex items-center space-x-3">
                <Logo width={128} height={128} className="h-16 w-16" />
                <span className="text-lg font-bold">Servecta</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 space-y-1 px-2 py-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    pathname === item.href
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-card border-r px-6 pb-4">
          <div className="flex h-20 shrink-0 items-center">
            <div className="flex items-center space-x-3">
              <Logo width={128} height={128} className="h-16 w-16" />
              <span className="text-lg font-bold">Servecta</span>
            </div>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold',
                          pathname === item.href
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        )}
                      >
                        <item.icon className="h-6 w-6 shrink-0" />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b bg-background px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="relative flex flex-1 items-center">
              <Search className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-muted-foreground pl-3" />
              <input
                className="block h-full w-full border-0 py-0 pl-10 pr-0 text-foreground placeholder:text-muted-foreground focus:ring-0 sm:text-sm bg-transparent"
                placeholder="Suchen..."
                type="search"
                name="search"
              />
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span className="font-semibold">Benachrichtigungen</span>
                    {unreadCount > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={markAllAsRead}
                        className="text-xs"
                      >
                        Alle lesen
                      </Button>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {loading ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Lade Benachrichtigungen...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Keine Benachrichtigungen
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.slice(0, 10).map((notification) => (
                        <DropdownMenuItem
                          key={notification._id}
                          className={cn(
                            'flex items-start space-x-3 p-3 cursor-pointer',
                            !notification.read && 'bg-muted/50'
                          )}
                          onClick={() => {
                            markAsRead(notification._id)
                            if (notification.actionUrl) {
                              window.location.href = notification.actionUrl
                            }
                          }}
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">
                              {notification.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatNotificationTime(notification.timestamp)}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </div>
                  )}
                  
                  {notifications.length > 10 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/portal/notifications" className="text-center">
                          Alle Benachrichtigungen anzeigen
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Profile dropdown */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium">{session.user?.name}</p>
                    <p className="text-xs text-muted-foreground">{session.user?.email}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="hidden sm:inline-flex">
                  {session.user?.role}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}