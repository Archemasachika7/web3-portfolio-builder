import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const allProjects = await db.select()
      .from(projects)
      .orderBy(desc(projects.updatedAt))
      .limit(limit)
      .offset(offset);

    const camelCaseProjects = allProjects.map(project => ({
      id: project.id,
      title: project.title,
      description: project.description,
      repoUrl: project.repoUrl,
      nftBadgeUrl: project.nftBadgeUrl,
      ipfs: {
        cid: project.ipfsCid,
        url: project.ipfsUrl,
        pinned: Boolean(project.ipfsPinned),
        name: project.assetName,
        size: project.assetSize
      },
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }));

    return NextResponse.json(camelCaseProjects);
  } catch (error) {
    console.error('projects GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, repoUrl, nftBadgeUrl, ipfsCid, ipfsUrl, ipfsPinned, assetName, assetSize } = body;

    // Validate required fields
    if (!title || typeof title !== 'string' || title.length < 1 || title.length > 500) {
      return NextResponse.json(
        { error: 'Title required and must be between 1 and 500 characters' },
        { status: 400 }
      );
    }

    if (!description || typeof description !== 'string' || description.length < 1 || description.length > 2000) {
      return NextResponse.json(
        { error: 'Description required and must be between 1 and 2000 characters' },
        { status: 400 }
      );
    }

    // Validate URLs if provided
    if (repoUrl && typeof repoUrl === 'string') {
      try {
        new URL(repoUrl);
      } catch {
        return NextResponse.json({ error: 'Invalid repo URL format' }, { status: 400 });
      }
    }

    if (nftBadgeUrl && typeof nftBadgeUrl === 'string') {
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

    const timestamp = Date.now();

    const newProject = await db.insert(projects)
      .values({
        title: title.trim(),
        description: description.trim(),
        repoUrl: repoUrl || null,
        nftBadgeUrl: nftBadgeUrl || null,
        ipfsCid: ipfsCid || null,
        ipfsUrl: ipfsUrl || null,
        ipfsPinned: ipfsPinned ? 1 : 0,
        assetName: assetName || null,
        assetSize: assetSize || null,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .returning();

    const response = {
      id: newProject[0].id,
      title: newProject[0].title,
      description: newProject[0].description,
      repoUrl: newProject[0].repoUrl,
      nftBadgeUrl: newProject[0].nftBadgeUrl,
      ipfs: {
        cid: newProject[0].ipfsCid,
        url: newProject[0].ipfsUrl,
        pinned: Boolean(newProject[0].ipfsPinned),
        name: newProject[0].assetName,
        size: newProject[0].assetSize
      },
      createdAt: newProject[0].createdAt,
      updatedAt: newProject[0].updatedAt,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('projects POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}