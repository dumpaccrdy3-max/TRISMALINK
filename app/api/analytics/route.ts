import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Session } from 'next-auth'

// GET - Get analytics overview for authenticated user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get('days') || '30')

    // Calculate date range
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get shortlinks stats
    const shortlinks = await prisma.shortlink.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        shortCode: true,
        customAlias: true,
        clicks: true,
        isActive: true
      }
    })

    const totalShortlinks = shortlinks.length
    const totalShortlinkClicks = shortlinks.reduce((sum, link) => sum + link.clicks, 0)
    const activeShortlinks = shortlinks.filter(link => link.isActive).length

    // Get linklists stats
    const linklists = await prisma.linkList.findMany({
      where: { userId: session.user.id },
      include: {
        items: true
      }
    })

    const totalLinklists = linklists.length
    const totalListItems = linklists.reduce((sum, list) => sum + list.items.length, 0)
    const totalListClicks = linklists.reduce((sum, list) => 
      sum + list.items.reduce((itemSum, item) => itemSum + item.clicks, 0), 0
    )

    // Get recent clicks (last 30 days) with date grouping
    const recentClicks = await prisma.clickAnalytics.findMany({
      where: {
        OR: [
          {
            shortlink: {
              userId: session.user.id
            }
          },
          {
            listItem: {
              list: {
                userId: session.user.id
              }
            }
          }
        ],
        clickedAt: {
          gte: startDate
        }
      },
      select: {
        clickedAt: true,
        shortlinkId: true,
        listItemId: true
      },
      orderBy: {
        clickedAt: 'desc'
      }
    })

    // Group clicks by date
    const clicksByDate: Record<string, number> = {}
    recentClicks.forEach(click => {
      const date = click.clickedAt.toISOString().split('T')[0]
      clicksByDate[date] = (clicksByDate[date] || 0) + 1
    })

    // Convert to array format for charts
    const clicksOverTime = Object.entries(clicksByDate)
      .map(([date, count]) => ({ date, clicks: count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Get top performing shortlinks
    const topShortlinks = shortlinks
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5)
      .map(link => ({
        id: link.id,
        name: link.customAlias || link.shortCode,
        clicks: link.clicks
      }))

    // Get top performing list items
    const allListItems = linklists.flatMap(list => 
      list.items.map(item => ({
        id: item.id,
        title: item.title,
        clicks: item.clicks,
        listTitle: list.title
      }))
    )
    
    const topListItems = allListItems
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5)

    return NextResponse.json({
      overview: {
        totalShortlinks,
        activeShortlinks,
        totalShortlinkClicks,
        totalLinklists,
        totalListItems,
        totalListClicks,
        totalClicks: totalShortlinkClicks + totalListClicks
      },
      clicksOverTime,
      topShortlinks,
      topListItems,
      recentClicks: recentClicks.slice(0, 10).map(click => ({
        date: click.clickedAt,
        type: click.shortlinkId ? 'shortlink' : 'listitem'
      }))
    })
  } catch (error) {
    console.error('GET analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
