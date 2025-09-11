import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const settingsRecord = await db.select()
      .from(settings)
      .limit(1);

    if (settingsRecord.length === 0) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }

    const response = {
      displayName: settingsRecord[0].displayName
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('settings GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { displayName } = body;

    if (!displayName || typeof displayName !== 'string' || displayName.trim().length === 0) {
      return NextResponse.json({ error: 'displayName is required and must be a non-empty string' }, { status: 400 });
    }

    // Check if settings exist
    const existingSettings = await db.select()
      .from(settings)
      .limit(1);

    let updatedSettings;
    
    if (existingSettings.length === 0) {
      // Create new settings record
      updatedSettings = await db.insert(settings)
        .values({
          displayName: displayName.trim(),
          updatedAt: Date.now(),
        })
        .returning();
    } else {
      // Update existing settings record
      updatedSettings = await db.update(settings)
        .set({
          displayName: displayName.trim(),
          updatedAt: Date.now(),
        })
        .where(eq(settings.id, existingSettings[0].id))
        .returning();
    }

    const response = {
      displayName: updatedSettings[0].displayName
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('settings PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}