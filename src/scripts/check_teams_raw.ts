
// Use raw pg to avoid model loading issues
import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function check() {
    await client.connect();
    const userId = 'c0d2356f-5313-4b65-8d73-d573d5bd4625';
    console.log('Checking teams for user:', userId);

    const res = await client.query('SELECT id, name, "createdBy" FROM teams WHERE "createdBy" = $1', [userId]);

    console.log(`Found ${res.rowCount} teams:`);
    res.rows.forEach(r => console.log(`- ${r.name} (createdBy: ${r.createdBy})`));

    await client.end();
}

check().catch(e => {
    console.error(e);
    process.exit(1);
});
