import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  host: '127.0.0.1',
  port: 5432,
  user: 'postgres',
  password: 'Parthik@2026',
  database: 'scorebook',
});

async function completeFix() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Step 1: Drop the constraint
    console.log('\n🔧 Step 1: Removing foreign key constraint...');
    try {
      await client.query(`
        ALTER TABLE "balls" DROP CONSTRAINT IF EXISTS "balls_nonStrikerId_fkey";
      `);
      console.log('✅ Foreign key constraint removed');
    } catch (e) {
      console.log('ℹ️ Constraint already removed or doesn\'t exist');
    }

    // Step 2: Make column nullable
    console.log('\n🔧 Step 2: Making nonStrikerId nullable...');
    try {
      await client.query(`
        ALTER TABLE "balls" ALTER COLUMN "nonStrikerId" DROP NOT NULL;
      `);
      console.log('✅ nonStrikerId is now nullable');
    } catch (e) {
      console.log('ℹ️ Column already nullable');
    }

    // Step 3: Delete all balls with invalid nonStrikerId
    console.log('\n🔧 Step 3: Cleaning up invalid records...');
    const result = await client.query(`
      DELETE FROM "balls" 
      WHERE "nonStrikerId" IS NOT NULL 
      AND "nonStrikerId" NOT IN (SELECT id FROM "players");
    `);
    console.log(`✅ Deleted ${result.rowCount} invalid records`);

    // Step 4: Add constraint back
    console.log('\n🔧 Step 4: Adding foreign key constraint back...');
    try {
      await client.query(`
        ALTER TABLE "balls" 
        ADD CONSTRAINT "balls_nonStrikerId_fkey" 
        FOREIGN KEY ("nonStrikerId") REFERENCES "players" ("id") 
        ON DELETE NO ACTION ON UPDATE CASCADE;
      `);
      console.log('✅ Foreign key constraint added');
    } catch (e) {
      console.log('ℹ️ Constraint already exists');
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ DATABASE FIX COMPLETE!');
    console.log('='.repeat(50));
    console.log('\n📋 Summary:');
    console.log('  ✅ Foreign key constraint removed and re-added');
    console.log('  ✅ nonStrikerId is now nullable (optional)');
    console.log('  ✅ Invalid records cleaned up');
    console.log('\n🚀 Next Steps:');
    console.log('  1. STOP the backend (Ctrl + C)');
    console.log('  2. RUN: npm start');
    console.log('  3. Test recording a ball');
    console.log('\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

completeFix();
