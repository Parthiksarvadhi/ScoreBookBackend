#!/usr/bin/env node

import { Sequelize } from 'sequelize';
import dbConfig from './dist/src/config/database.js';

async function debugBallValidation() {
  try {
    console.log('🔍 Debugging Ball Validation...\n');
    
    const matchId = process.argv[2] || '59b0004f-ed60-47f1-b643-bfaefb6d0e3f';
    const over = parseInt(process.argv[3]) || 2;
    const ballNumber = parseInt(process.argv[4]) || 1;
    const batsmanId = process.argv[5];
    const bowlerId = process.argv[6];
    const runs = parseInt(process.argv[7]) || 0;
    const extras = process.argv[8] || 'none';
    const extraRuns = parseInt(process.argv[9]) || 0;
    
    if (!batsmanId || !bowlerId) {
      console.log('❌ Usage: node debug-ball-validation.mjs <matchId> <over> <ballNumber> <batsmanId> <bowlerId> [runs] [extras] [extraRuns]');
      console.log('\nExample:');
      console.log('  node debug-ball-validation.mjs 59b0004f-ed60-47f1-b643-bfaefb6d0e3f 2 1 batsman-id bowler-id 0 none 0');
      process.exit(1);
    }
    
    console.log('📋 Input Data:');
    console.log(`  Match ID: ${matchId}`);
    console.log(`  Over: ${over}, Ball: ${ballNumber}`);
    console.log(`  Batsman: ${batsmanId}`);
    console.log(`  Bowler: ${bowlerId}`);
    console.log(`  Runs: ${runs}, Extras: ${extras}, Extra Runs: ${extraRuns}\n`);
    
    // Create sequelize connection
    const sequelize = new Sequelize(
      dbConfig.database,
      dbConfig.username,
      dbConfig.password,
      dbConfig
    );
    
    await sequelize.authenticate();
    
    // Get all balls
    const balls = await sequelize.query(
      `SELECT * FROM balls WHERE "matchId" = :matchId ORDER BY "over" ASC, "ballNumber" ASC`,
      {
        replacements: { matchId },
        type: sequelize.QueryTypes.SELECT,
      }
    );
    
    console.log(`⚾ Total Balls Recorded: ${balls.length}\n`);
    
    if (balls.length === 0) {
      console.log('✅ First ball - no validation needed');
      await sequelize.close();
      process.exit(0);
    }
    
    const lastBall = balls[balls.length - 1];
    console.log('📍 Last Ball Recorded:');
    console.log(`  Over: ${lastBall.over}, Ball: ${lastBall.ballNumber}`);
    console.log(`  Batsman: ${lastBall.batsmanId}`);
    console.log(`  Bowler: ${lastBall.bowlerId}`);
    console.log(`  Runs: ${lastBall.runs}, Extra Runs: ${lastBall.extraRuns}`);
    console.log(`  Total Runs: ${lastBall.runs + lastBall.extraRuns}\n`);
    
    // Validation checks
    console.log('🔍 Validation Analysis:\n');
    
    let isValid = true;
    const errors = [];
    
    // Check 1: New over validation
    if (ballNumber === 1 && over > 1) {
      console.log('✅ Check 1: New Over Starting');
      
      // Check if last ball was ball 6
      if (lastBall.ballNumber !== 6) {
        const msg = `❌ Last ball should be ball 6, but it's ball ${lastBall.ballNumber}`;
        console.log(`   ${msg}`);
        errors.push(msg);
        isValid = false;
      } else {
        console.log('   ✅ Last ball was ball 6 (over complete)');
      }
      
      // Check bowler change
      if (bowlerId === lastBall.bowlerId) {
        const msg = `❌ Bowler must change! Same bowler cannot bowl consecutive overs`;
        console.log(`   ${msg}`);
        console.log(`      Previous: ${lastBall.bowlerId}`);
        console.log(`      You sent: ${bowlerId}`);
        errors.push(msg);
        isValid = false;
      } else {
        console.log('   ✅ Bowler changed correctly');
        console.log(`      Previous: ${lastBall.bowlerId}`);
        console.log(`      New: ${bowlerId}`);
      }
      
      // Check strike change
      const totalRuns = lastBall.runs + lastBall.extraRuns;
      console.log(`   📊 Last ball runs: ${totalRuns}`);
      
      if (totalRuns % 2 === 1) {
        console.log('   ⚡ Odd runs - same batsman should continue');
        if (batsmanId !== lastBall.batsmanId) {
          const msg = `❌ After odd runs, same batsman must come on strike`;
          console.log(`   ${msg}`);
          console.log(`      Previous: ${lastBall.batsmanId}`);
          console.log(`      You sent: ${batsmanId}`);
          errors.push(msg);
          isValid = false;
        } else {
          console.log('   ✅ Batsman stayed correctly (same)');
          console.log(`      Batsman: ${batsmanId}`);
        }
      } else {
        console.log('   ⚡ Even runs - different batsman should come on strike');
        if (batsmanId === lastBall.batsmanId) {
          const msg = `❌ After even runs, different batsman must come on strike`;
          console.log(`   ${msg}`);
          console.log(`      Previous: ${lastBall.batsmanId}`);
          console.log(`      You sent: ${batsmanId}`);
          errors.push(msg);
          isValid = false;
        } else {
          console.log('   ✅ Batsman changed correctly (different)');
          console.log(`      Previous: ${lastBall.batsmanId}`);
          console.log(`      New: ${batsmanId}`);
        }
      }
    } else if (ballNumber > 1 && over === lastBall.over) {
      console.log('✅ Check 1: Same Over, Next Ball');
      
      if (ballNumber !== lastBall.ballNumber + 1) {
        const msg = `❌ Ball number should be ${lastBall.ballNumber + 1}, but got ${ballNumber}`;
        console.log(`   ${msg}`);
        errors.push(msg);
        isValid = false;
      } else {
        console.log(`   ✅ Ball number sequence correct`);
      }
      
      // Check strike change within over
      const totalRuns = lastBall.runs + lastBall.extraRuns;
      console.log(`   📊 Last ball runs: ${totalRuns}`);
      
      if (totalRuns % 2 === 1) {
        console.log('   ⚡ Odd runs - same batsman should continue');
        if (batsmanId !== lastBall.batsmanId) {
          const msg = `❌ After odd runs, same batsman must continue`;
          console.log(`   ${msg}`);
          console.log(`      Previous: ${lastBall.batsmanId}`);
          console.log(`      You sent: ${batsmanId}`);
          errors.push(msg);
          isValid = false;
        } else {
          console.log('   ✅ Batsman stayed correctly (same)');
        }
      } else {
        console.log('   ⚡ Even runs - different batsman should come on strike');
        if (batsmanId === lastBall.batsmanId) {
          const msg = `❌ After even runs, different batsman must come on strike`;
          console.log(`   ${msg}`);
          console.log(`      Previous: ${lastBall.batsmanId}`);
          console.log(`      You sent: ${batsmanId}`);
          errors.push(msg);
          isValid = false;
        } else {
          console.log('   ✅ Batsman changed correctly (different)');
        }
      }
    }
    
    console.log('\n' + (isValid ? '✅ All checks passed!' : '❌ Validation failed!'));
    
    if (errors.length > 0) {
      console.log('\n📋 Errors:');
      errors.forEach((err, idx) => {
        console.log(`  ${idx + 1}. ${err}`);
      });
    }
    
    await sequelize.close();
    process.exit(isValid ? 0 : 1);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

debugBallValidation();
