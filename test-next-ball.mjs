#!/usr/bin/env node

import { Sequelize } from 'sequelize';
import dbConfig from './dist/src/config/database.js';

async function testNextBall() {
  try {
    console.log('🧪 Testing Next Ball Validation...\n');
    
    const matchId = process.argv[2] || '59b0004f-ed60-47f1-b643-bfaefb6d0e3f';
    const over = parseInt(process.argv[3]) || 2;
    const ballNumber = parseInt(process.argv[4]) || 1;
    const batsmanId = process.argv[5];
    const bowlerId = process.argv[6];
    
    if (!batsmanId || !bowlerId) {
      console.log('❌ Usage: node test-next-ball.mjs <matchId> <over> <ballNumber> <batsmanId> <bowlerId>');
      console.log('\nExample:');
      console.log('  node test-next-ball.mjs 59b0004f-ed60-47f1-b643-bfaefb6d0e3f 2 1 f25c6494-37cc-4e96-887a-71c982d2df3c 809215e4-e1c6-4983-a072-faa8d3d520d4');
      process.exit(1);
    }
    
    console.log(`📋 Match ID: ${matchId}`);
    console.log(`🎯 Testing: Over ${over}, Ball ${ballNumber}`);
    console.log(`   Batsman: ${batsmanId}`);
    console.log(`   Bowler: ${bowlerId}\n`);
    
    // Create sequelize connection
    const sequelize = new Sequelize(
      dbConfig.database,
      dbConfig.username,
      dbConfig.password,
      dbConfig
    );
    
    await sequelize.authenticate();
    
    // Get last ball
    const lastBalls = await sequelize.query(
      `SELECT * FROM balls WHERE "matchId" = :matchId ORDER BY "over" DESC, "ballNumber" DESC LIMIT 1`,
      {
        replacements: { matchId },
        type: sequelize.QueryTypes.SELECT,
      }
    );
    
    if (lastBalls.length === 0) {
      console.log('✅ First ball - no validation needed');
      await sequelize.close();
      process.exit(0);
    }
    
    const lastBall = lastBalls[0];
    console.log('📍 Last Ball:');
    console.log(`  Over ${lastBall.over}.${lastBall.ballNumber}`);
    console.log(`  Batsman: ${lastBall.batsmanId}`);
    console.log(`  Bowler: ${lastBall.bowlerId}`);
    console.log(`  Runs: ${lastBall.runs}, Extra: ${lastBall.extraRuns}\n`);
    
    // Validation checks
    console.log('🔍 Validation Checks:\n');
    
    let isValid = true;
    
    // Check 1: New over
    if (ballNumber === 1 && over > 1) {
      console.log('✅ Check 1: New over starting');
      
      // Check if last ball was ball 6
      if (lastBall.ballNumber !== 6) {
        console.log(`   ❌ ERROR: Last ball should be ball 6, but it's ball ${lastBall.ballNumber}`);
        isValid = false;
      } else {
        console.log('   ✅ Last ball was ball 6 (over complete)');
      }
      
      // Check bowler change
      if (bowlerId === lastBall.bowlerId) {
        console.log('   ❌ ERROR: Bowler must change!');
        console.log(`      You sent: ${bowlerId}`);
        console.log(`      Previous: ${lastBall.bowlerId}`);
        console.log('      Same bowler cannot bowl consecutive overs');
        isValid = false;
      } else {
        console.log('   ✅ Bowler changed correctly');
        console.log(`      Previous: ${lastBall.bowlerId}`);
        console.log(`      New: ${bowlerId}`);
      }
      
      // Check strike change
      const totalRuns = lastBall.runs + lastBall.extraRuns;
      console.log(`   📊 Total runs on last ball: ${totalRuns}`);
      
      if (totalRuns % 2 === 1) {
        console.log('   ⚡ Odd runs - strike should change');
        if (batsmanId === lastBall.batsmanId) {
          console.log(`   ❌ ERROR: Batsman should change after odd runs`);
          console.log(`      You sent: ${batsmanId}`);
          console.log(`      Previous: ${lastBall.batsmanId}`);
          isValid = false;
        } else {
          console.log('   ✅ Batsman changed correctly');
          console.log(`      Previous: ${lastBall.batsmanId}`);
          console.log(`      New: ${batsmanId}`);
        }
      } else {
        console.log('   ⚡ Even runs - strike should stay');
        if (batsmanId !== lastBall.batsmanId) {
          console.log(`   ❌ ERROR: Batsman should NOT change after even runs`);
          console.log(`      You sent: ${batsmanId}`);
          console.log(`      Previous: ${lastBall.batsmanId}`);
          isValid = false;
        } else {
          console.log('   ✅ Batsman stayed correctly');
          console.log(`      Batsman: ${batsmanId}`);
        }
      }
    }
    
    console.log('\n' + (isValid ? '✅ All checks passed! Ball is valid.' : '❌ Validation failed! Fix the issues above.'));
    
    await sequelize.close();
    process.exit(isValid ? 0 : 1);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testNextBall();
