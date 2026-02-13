import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  host: '127.0.0.1',
  port: 5432,
  user: 'postgres',
  password: 'Parthik@2026',
  database: 'scorebook',
});

async function fixDatabase() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Step 1: Remove foreign key constraint if it exists
    console.log('🔧 Removing old foreign key constraint...');
    try {
      await client.query(`
        ALTER TABLE "balls" DROP CONSTRAINT IF EXISTS "balls_nonStrikerId_fkey";
      `);
      console.log('✅ Foreign key constraint removed');
    } catch (e) {
      console.log('ℹ️ Foreign key constraint already removed or doesn\'t exist');
    }

    // Step 2: Delete all balls with invalid nonStrikerId
    console.log('🗑️ Deleting balls with invalid nonStrikerId...');
    const result = await client.query(`
      DELETE FROM "balls" 
      WHERE "nonStrikerId" NOT IN (SELECT id FROM "players")
      OR "nonStrikerId" IS NULL;
    `);
    console.log(`✅ Deleted ${result.rowCount} invalid ball records`);

    // Step 3: Make nonStrikerId NOT NULL
    console.log('🔧 Setting nonStrikerId as NOT NULL...');
    try {
      await client.query(`
        ALTER TABLE "balls" ALTER COLUMN "nonStrikerId" SET NOT NULL;
      `);
      console.log('✅ nonStrikerId set to NOT NULL');
    } catch (e) {
      console.log('ℹ️ nonStrikerId already NOT NULL');
    }

    // Step 4: Add foreign key constraint
    console.log('🔧 Adding foreign key constraint...');
    try {
      await client.query(`
        ALTER TABLE "balls" 
        ADD CONSTRAINT "balls_nonStrikerId_fkey" 
        FOREIGN KEY ("nonStrikerId") REFERENCES "players" ("id") 
        ON DELETE NO ACTION ON UPDATE CASCADE;
      `);
      console.log('✅ Foreign key constraint added');
    } catch (e) {
      console.log('ℹ️ Foreign key constraint already exists');
    }

    console.log('\n✅ Database fixed successfully!');
    console.log('You can now restart the backend.');

  } catch (error) {
    console.error('❌ Error fixing database:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixDatabase();
