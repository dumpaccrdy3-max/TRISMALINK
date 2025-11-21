'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link as LinkIcon, List, BarChart3, Plus } from 'lucide-react'
import type { Session } from 'next-auth'

export default function DashboardPage() {
  const { data: session } = useSession() as { data: Session | null }

  const stats = [
    {
      title: 'Total Short Links',
      value: '0',
      description: 'Active shortlinks',
      icon: LinkIcon,
      href: '/links',
    },
    {
      title: 'Total Link Lists',
      value: '0',
      description: 'Published link pages',
      icon: List,
      href: '/lists',
    },
    {
      title: 'Total Clicks',
      value: '0',
      description: 'All time clicks',
      icon: BarChart3,
      href: '/analytics',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {session?.user?.username || 'User'}!
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Here's an overview of your links and activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Get started with creating your first links</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Link href="/links">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Short Link
            </Button>
          </Link>
          <Link href="/lists">
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Create Link List
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest shortlinks and link lists</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p>No activity yet. Create your first link to get started!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
