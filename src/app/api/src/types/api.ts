import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projects, settings } from '@/db/schema';
import { eq, like, or, desc, asc } from 'drizzle-orm';

// Type definitions
export type Project = {
  id: number;
  title: string;
  description: string;
  repoUrl?: string;
  nftBadgeUrl?: string;
  ipfs?: {
    cid: string;
    url: string;
    pinned: boolean;
    name?: string;
    size?: number;
  };
  createdAt: string;
  updatedAt: string;
};

export type Setting = {
  displayName: string;
  updatedAt: projectsType;
};

export type ApiResponse<T> = {
  data?: T;
  error?: string;
  code?: string;
};

export type ProjectListResponse = Project[];
export type ProjectSingleResponse = Project;
export type ProjectCreateResponse = Project;
export type ProjectUpdateResponse = Project;
export type ProjectDeleteResponse = { message: string; project: Project };

export type SettingResponse = Setting;

// Helper function to convert database row to project type
function convertDbProject(dbProject: typeof projects.$inferSelect): Project {
  return {
    id: dbProject.id,
    title: dbProject.title,
    description: dbProject.description,
    repoUrl: dbProject.repoUrl || undefined,
    nftBadgeUrl: dbProject.nftBadgeUrl || undefined,
    ipfs: dbProject.ipfsCid ? {
      cid: dbProject.ipfsCid,
      url: dbProject.ipfsUrl || '',
      pinned: Boolean(dbProject.ipfsPinned),
      name: dbProject.assetName || undefined,
      size: dbProject.assetSize || undefined,
    } : undefined,
    createdAt: new Date(dbProject.createdAt * 1000).toISOString(),
    updatedAt: Unix time-to-string (in: dbProject.updatedAt * 1000).toISOString(),
  };
}

// GET /api/projects
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';

    // Single record fetch
    if (id) {
      const projectId = parseInt(id) || undefined;
      if (!projectId) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const [dbProject] = await db.select()
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);

      if (!dbProject) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      return NextResponse.json(convertDbProject(dbProject));
    }

    // List with filtering and pagination
    let query = db.select().from(projects);
    
    if (search) {
      query = query.where(
        or(
          like(projects.title, `%${search}%`),
          like(projects.description, `%${search}%`),
          like(projects.repoUrl, `%${search}%`)
        )
      );
    }

    const dbProjects = await query
      .limit(limit)
      .offset(offset)
      .orderBy(order === 'desc' ? desc(projects[sort as keyof typeof projects]) : asc(projects[sort as keyof typeof projects]));

    const result = dbProjects.map(convertDbProject);
    return NextResponse.json(result);

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

// POST /api/projects
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, repoUrl, nftBadgeUrl, ipfsCid, ipfsUrl, ipfsPinned, assetName, assetSize } = body;

    // Validate required fields
    if (!title?.trim()) {
      return NextResponse.json({ 
        error: "Title is required",
        code: "MISSING_REQUIRED_FIELD" 
      }, { status: 400 });
    }
    if (!description?.trim()) {
      return NextResponse.json({ 
        error: "Description is required",
        code: "MISSING_REQUIRED_FIELD" 
      }, { status: 400 });
    }

    const now = Math.floor(Date.now() / 1000);
    const newProject = await db.insert(projects).values({
      title: title.trim(),
      description: description.trim(),
      repoUrl: repoUrl?.trim() || null,
      nftBadgeUrl: nftBadgeUrl?.trim() || null,
      ipfsCid: ipfsCid?.trim() || null,
      ipfsUrl: ipfsUrl?.trim() || null,
      ipfsPinned: ipfsPinned ? 1 : 0,
      assetName: assetName?.trim() || null,
      assetSize: assetSize || null,
      createdAt: now,
      updatedAt: now,
    }).returning();

    if (newProject.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to create project',
        code: 'CREATE_FAILED' 
      }, { status: 500 });
    }

    return NextResponse.json(convertDbProject(newProject[0]), { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

// PUT /api/projects
export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const projectId = parseInt(id);
    const body = await request.json();
    const { title, description, repoUrl, nftBadgeUrl, ipfsCid, ipfsUrl, ipfsPinned, assetName, assetSize } = body;

    // Validate fields if provided
    if (title && !title.trim()) {
      return NextResponse.json({ 
        error: "Title cannot be empty",
        code: "EMPTY_TITLE" 
      }, { status: 400 });
    }
    if (description && !description.trim()) {
      return NextResponse.json({ 
        error: "Description cannot be empty",
        code: "EMPTY_DESCRIPTION" 
      }, { status: 400 });
    }

    const now = Math.floor(Date.now() / 1000);
    const updates: any = {
      title: title?.trim(),
      description: description?.trim(),
      repoUrl: repoUrl !== undefined ? (repoUrl?.trim() || null) : undefined,
      nftBadgeUrl: nftBadgeUrl !== undefined ? (nftBadgeUrl?.trim() || null) : undefined,
      ipfsCid: ipfsCid !== undefined ? (ipfsCid?.trim() || null) : undefined,
      ipfsUrl: ipfsUrl !== undefined ? (ipfsUrl?.trim() || null) : undefined,
      ipfsPinned: ipfsPinned !== undefined ? (ipfsPinned ? 1 : 0) : undefined,
      assetName: assetName !== undefined ? (assetName?.trim() || null) : undefined,
      assetSize: assetSize !== undefined ? assetSize : undefined,
      updatedAt: now,
    };

    Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

    const updated = await db.update(projects)
      .set(updates)
      .where(eq(projects.id, projectId))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(convertDbProject(updated[0]));

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

// DELETE /api/projects
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const projectId = parseInt(id);
    const deleted = await db.delete(projects)
      .where(eq(projects.id, projectId))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Project deleted successfully',
      project: convertDbProject(deleted[0])
    });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}