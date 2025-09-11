import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Valid ID is required' }, { status: 400 });
    }

    const project = await db.select()
      .from(projects)
      .where(eq(projects.id, parseInt(id)))
      .limit(1);

    if (project.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const response = {
      id: project[0].id,
      title: project[0].title,
      description: project[0].description,
      repoUrl: project[0].repoUrl,
      nftBadgeUrl: project[0].nftBadgeUrl,
      ipfs: {
        cid: project[0].ipfsCid,
        url: project[0].ipfsUrl,
        pinned: Boolean(project[0].ipfsPinned),
        name: project[0].assetName,
        size: project[0].assetSize
      },
      createdAt: project[0].createdAt,
      updatedAt: project[0].updatedAt,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('project GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Valid ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { title, description, repoUrl, nftBadgeUrl, ipfsCid, ipfsUrl, ipfsPinned, assetName, assetSize } = body;

    // Validate fields if provided
    if (title !== undefined && (typeof title !== 'string' || title.length < 1 || title.length > 500)) {
      return NextResponse.json({ error: 'Title must be between 1 and 500 characters' }, { status: 400 });
    }

    if (description !== undefined && (typeof description !== 'string' || description.length < 1 || description.length > 2000)) {
      return NextResponse.json({ error: 'Description must be between 1 and 2000 characters' }, { status: 400 });
    }

    // Validate URLs if provided
    if (repoUrl !== undefined && repoUrl !== null && typeof repoUrl === 'string') {
      try {
        new URL(repoUrl);
      } catch {
        return NextResponse.json({ error: 'Invalid repo URL format' }, { status: 400 });
      }
    }

    if (nftBadgeUrl !== undefined && nftBadgeUrl !== null && typeof nftBadgeUrl === 'string') {
      try {
        new URL(nftBadgeUrl);
      } catch {
        return NextResponse.json({ error: 'Invalid NFT badge URL format' }, { status: 400 });
      }
    }

    // Validate asset size
    if (assetSize !== undefined && assetSize !== null && assetSize < 0) {
      return NextResponse.json({ error: 'Asset size must be non-negative' }, { status: 400 });
    }

    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (repoUrl !== undefined) updateData.repoUrl = repoUrl;
    if (nftBadgeUrl !== undefined) updateData.nftBadgeUrl = nftBadgeUrl;
    if (ipfsCid !== undefined) updateData.ipfsCid = ipfsCid;
    if (ipfsUrl !== undefined) updateData.ipfsUrl = ipfsUrl;
    if (ipfsPinned !== undefined) updateData.ipfsPinned = ipfsPinned ? 1 : 0;
    if (assetName !== undefined) updateData.assetName = assetName;
    if (assetSize !== undefined) updateData.assetSize = assetSize;

    const updatedProjects = await db.update(projects)
      .set(updateData)
      .where(eq(projects.id, parseInt(id)))
      .returning();

    if (updatedProjects.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const response = {
      id: updatedProjects[0].id,
      title: updatedProjects[0].title,
      description: updatedProjects[0].description,
      repoUrl: updatedProjects[0].repoUrl,
      nftBadgeUrl: updatedProjects[0].nftBadgeUrl,
      ipfs: {
        cid: updatedProjects[0].ipfsCid,
        url: updatedProjects[0].ipfsUrl,
        pinned: Boolean(updatedProjects[0].ipfsPinned),
        name: updatedProjects[0].assetName,
        size: updatedProjects[0].assetSize
      },
      createdAt: updatedProjects[0].createdAt,
      updatedAt: updatedProjects[0].updatedAt,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('project PATCH error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Valid ID is required' }, { status: 400 });
    }

    const deletedProjects = await db.delete(projects)
      .where(eq(projects.id, parseInt(id)))
      .returning();

    if (deletedProjects.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Project deleted successfully',
      project: {
        id: deletedProjects[0].id,
        title: deletedProjects[0].title
      }
    });
  } catch (error) {
    console.error('project DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}