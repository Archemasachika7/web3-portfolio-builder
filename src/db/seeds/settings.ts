import { db } from '@/db';
import { settings } from '@/db/schema';

async function main() {
    const sampleSettings = [
        {
            displayName: 'ARCHISHMAN DAS',
            updatedAt: Date.now()
        }
    ];

    await db.insert(settings).values(sampleSettings);
    
    console.log('✅ Settings seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});