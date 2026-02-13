import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  host: '127.0.0.1',
  port: 5432,
  user: 'postgres',
  password: 'Parthik@2026',
  database: 'scorebook',
});

async function makeNonStrikerOptional() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Step 1: Remove foreign key constraint
    console.log('🔧 Removing foreign key constraint...');
    try {
      await client.query(`
        ALTER TABLE "balls" DROP CONSTRAINT IF EXISTS "balls_nonStrikerId_fkey";
      `);
      console.log('✅ Foreign key constraint removed');
    } catch (e) {
      console.log('ℹ️ Foreign key constraint already removed');
    }

    // Step 2: Make nonStrikerId nullable
    console.log('🔧 Making nonStrikerId nullable...');
    try {
      await client.query(`
        ALTER TABLE "balls" ALTER COLUMN "nonStrikerId" DROP NOT NULL;
      `);
      console.log('✅ nonStrikerId is now nullable');
    } catch (e) {
      console.log('ℹ️ nonStrikerId already nullable');
    }

    // Step 3: Add foreign key constraint back (with nullable column)
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

    console.log('\n✅ Database updated successfully!');
    console.log('nonStrikerId is now optional (nullable)');
    console.log('You can now restart the backend.');

  } catch (error) {
    console.error('❌ Error updating database:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

makeNonStrikerOptional();
