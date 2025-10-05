// Mailgun Statistics API Route
import { NextRequest, NextResponse } from 'next/server';
import { mailgunService } from '@/lib/mailgun';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Try to get project-specific events first
    const projectEvents = await mailgunService.getProjectEvents(projectId, 1000);
    
    let stats;
    if (projectEvents.length > 0) {
      // Calculate stats from project events
      stats = {
        accepted: projectEvents.filter(e => e.event === 'accepted').length,
        delivered: projectEvents.filter(e => e.event === 'delivered').length,
        failed: projectEvents.filter(e => e.event === 'failed').length,
        opened: projectEvents.filter(e => e.event === 'opened').length,
        clicked: projectEvents.filter(e => e.event === 'clicked').length,
        complained: projectEvents.filter(e => e.event === 'complained').length,
        unsubscribed: projectEvents.filter(e => e.event === 'unsubscribed').length,
        stored: projectEvents.filter(e => e.event === 'stored').length,
        total: projectEvents.length
      };
    } else {
      // Fallback to domain stats
      const domainStats = await mailgunService.getDomainStats(startDate || undefined, endDate || undefined);
      stats = domainStats.stats;
    }

    // Calculate performance metrics
    const performanceMetrics = {
      delivery_rate: mailgunService.calculateDeliveryRate(stats),
      open_rate: mailgunService.calculateOpenRate(stats),
      click_rate: mailgunService.calculateClickRate(stats),
      bounce_rate: mailgunService.calculateBounceRate(stats),
    };

    return NextResponse.json({
      success: true,
      data: {
        project_id: projectId,
        stats,
        performance_metrics: performanceMetrics,
        time_range: {
          start: startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end: endDate || new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Error fetching Mailgun stats:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch Mailgun statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
