import db from '../models/index.js';

async function checkTeamOwnership() {
    const userId = 'c0d2356f-5313-4b65-8d73-d573d5bd4625'; // User ID from logs

    // Wait a bit for models to initialize (due to async import in index.ts)
    console.log('Waiting for models to initialize...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
        // Check if db.Team is available directly or under default
        const Team = db.Team || (db.default && db.default.Team);

        if (!Team) {
            console.error('Team model not loaded yet! Keys:', Object.keys(db));
            return;
        }

        console.log(`Checking teams for user: ${userId}`);
        const teams = await Team.findAll({
            where: {
                createdBy: userId
            },
            attributes: ['id', 'name', 'createdBy']
        });

        console.log(`Found ${teams.length} teams created by this user:`);
        teams.forEach((t) => console.log(`- ${t.name} (createdBy: ${t.createdBy})`));

    } catch (error) {
        console.error('Error checking teams:', error);
    } finally {
        process.exit();
    }
}

checkTeamOwnership();
