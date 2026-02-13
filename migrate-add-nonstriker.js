/**
 * Migration: Add nonStrikerId column to balls table
 * 
 * This script adds the nonStrikerId column to track the non-striker
 * at the time each ball was bowled.
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

const client = new Client({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Parthik@2026',
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'scorebook',
});

async function migrate() {
  try {
    await client.connect();
    console.log('✓ Connected to database');

    // Check if column already exists
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'balls' AND column_name = 'nonStrikerId'
    `);

    if (checkColumn.rows.length > 0) {
      console.log('✓ Column nonStrikerId already exists');
      await client.end();
      return;
    }

    console.log('📝 Adding nonStrikerId column to balls table...');

    // First, add the column as nullable
    await client.query(`
      ALTER TABLE balls 
      ADD COLUMN "nonStrikerId" UUID;
    `);
    console.log('✓ Column added (nullable)');

    // For existing balls, set nonStrikerId to the batsmanId (as a placeholder)
    // In production, you'd want to replay the match to get the correct non-striker
    console.log('📝 Setting nonStrikerId for existing balls...');
    await client.query(`
      UPDATE balls 
      SET "nonStrikerId" = "batsmanId" 
      WHERE "nonStrikerId" IS NULL;
    `);
    console.log('✓ Existing balls updated');

    // Now make the column NOT NULL
    console.log('📝 Making column NOT NULL...');
    await client.query(`
      ALTER TABLE balls 
      ALTER COLUMN "nonStrikerId" SET NOT NULL;
    `);
    console.log('✓ Column is now NOT NULL');

    // Add foreign key constraint
    console.log('📝 Adding foreign key constraint...');
    await client.query(`
      ALTER TABLE balls 
      ADD CONSTRAINT fk_balls_nonstriker 
      FOREIGN KEY ("nonStrikerId") REFERENCES players(id);
    `);
    console.log('✓ Foreign key constraint added');

    // Add comment
    await client.query(`
      COMMENT ON COLUMN balls."nonStrikerId" IS 'Non-striker at the other end when this ball was bowled';
    `);
    console.log('✓ Column comment added');

    console.log('\n✅ Migration completed successfully!');
    console.log('\nChanges made:');
    console.log('  • Added nonStrikerId column (UUID)');
    console.log('  • Set existing balls nonStrikerId to batsmanId (placeholder)');
    console.log('  • Made column NOT NULL');
    console.log('  • Added foreign key constraint to players table');
    console.log('  • Added column comment');
    console.log('\n⚠️  NOTE: For existing balls, nonStrikerId is set to batsmanId as a placeholder.');
    console.log('   You should replay the match to get the correct non-striker values.');

    await client.end();
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  }
}

migrate();
