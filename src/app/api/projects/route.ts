// src/app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { googleSheetsService, GoogleSheetsProject } from '@/lib/google-sheets';

export async function GET(request: NextRequest) {
  try {
    // Fetch all projects from Google Sheets
    const projects = await googleSheetsService.getProjects();

    return NextResponse.json({
      success: true,
      data: projects,
      count: projects.length
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, company_name, niche, no_of_leads = 0 } = body;

    if (!user_id || !company_name || !niche) {
      return NextResponse.json(
        { error: 'user_id, company_name, and niche are required' },
        { status: 400 }
      );
    }

    // Generate a new project ID
    const projectId = `${company_name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;

    const newProject: GoogleSheetsProject = {
      project_id: projectId,
      user_id,
      company_name,
      niche,
      no_of_leads,
      status: 'Created',
      created_at: new Date().toISOString()
    };

    // Add project to Google Sheets using the service
    const success = await googleSheetsService.addProject(newProject);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to add project to Google Sheets' },
        { status: 500 }
      );
    }

    console.log('New project created and added to Google Sheets:', newProject);

    return NextResponse.json({
      success: true,
      data: newProject
    });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_id, lead_count } = body;

    if (!project_id || lead_count === undefined) {
      return NextResponse.json(
        { error: 'project_id and lead_count are required' },
        { status: 400 }
      );
    }

    // Update project lead count in Google Sheets
    const success = await googleSheetsService.updateProjectLeadCount(project_id, lead_count);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update project lead count in Google Sheets' },
        { status: 500 }
      );
    }

    console.log('Project lead count updated in Google Sheets:', project_id, lead_count);

    return NextResponse.json({
      success: true,
      message: 'Project lead count updated successfully'
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}
