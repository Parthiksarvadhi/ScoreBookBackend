
const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
const backendEnvPath = path.resolve(__dirname, '../../.env');
console.log('Loading .env from:', backendEnvPath);
dotenv.config({ path: backendEnvPath });

// Construct connection string explicitly if DATABASE_URL is missing
const dbUser = process.env.DB_USER || 'postgres';
const dbPass = process.env.DB_PASSWORD ? encodeURIComponent(process.env.DB_PASSWORD) : '';
const dbHost = process.env.DB_HOST || '127.0.0.1';
const dbPort = process.env.DB_PORT || '5432';
const dbName = process.env.DB_NAME || 'scorebook';

let connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    connectionString = `postgresql://${dbUser}:${dbPass}@${dbHost}:${dbPort}/${dbName}`;
}

const client = new Client({
    connectionString: connectionString,
});

async function check() {
    try {
        await client.connect();
        console.log('Connected!');

        const targetUserId = 'c0d2356f-5313-4b65-8d73-d573d5bd4625';

        console.log('Querying ALL teams (limit 50)...');
        const res = await client.query('SELECT id, name, "createdBy" FROM teams LIMIT 50');

        console.log(`Found ${res.rowCount} total teams:`);
        res.rows.forEach(r => {
            let status = '';
            if (r.createdBy === targetUserId) status = ' [MATCHES TARGET!]';
            console.log(`- ${r.name} (createdBy: ${r.createdBy})${status}`);
        });

    } catch (err) {
        console.error('Database Error:', err);
    } finally {
        await client.end();
    }
}

check();
