const pool = require('./db');

async function migrate() {
    try {
        console.log('Starting migration...');
        
        // 1. Add class_id to results if it doesn't exist
        const [resultsCols] = await pool.query("SHOW COLUMNS FROM results LIKE 'class_id'");
        if (resultsCols.length === 0) {
            console.log("Adding 'class_id' column to 'results' table...");
            await pool.query(`
                ALTER TABLE results 
                ADD COLUMN class_id INT NULL, 
                ADD FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL
            `);
            console.log("'class_id' added to 'results'.");
        } else {
            console.log("'class_id' column already exists in 'results'.");
        }

        // 2. Add class_id to term_remarks if it doesn't exist
        const [remarksCols] = await pool.query("SHOW COLUMNS FROM term_remarks LIKE 'class_id'");
        if (remarksCols.length === 0) {
            console.log("Adding 'class_id' column to 'term_remarks' table...");
            await pool.query(`
                ALTER TABLE term_remarks 
                ADD COLUMN class_id INT NULL, 
                ADD FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL
            `);
            console.log("'class_id' added to 'term_remarks'.");
        } else {
            console.log("'class_id' column already exists in 'term_remarks'.");
        }

        // 3. Add rating and attendance columns to term_remarks if they don't exist
        const ratingColumns = [
            'punctuality',
            'neatness',
            'honesty',
            'peer_relation',
            'attentiveness',
            'perseverance',
            'leadership',
            'handwriting',
            'sports',
            'crafts',
            'days_open',
            'days_present'
        ];

        for (const col of ratingColumns) {
            const [cols] = await pool.query(`SHOW COLUMNS FROM term_remarks LIKE ?`, [col]);
            if (cols.length === 0) {
                console.log(`Adding '${col}' column to 'term_remarks' table...`);
                await pool.query(`ALTER TABLE term_remarks ADD COLUMN \`${col}\` INT NULL`);
                console.log(`'${col}' added to 'term_remarks'.`);
            } else {
                console.log(`'${col}' column already exists in 'term_remarks'.`);
            }
        }

        // 4. Populate existing records with student's current class_id
        console.log('Populating class_id for existing results...');
        await pool.query(`
            UPDATE results r 
            JOIN users u ON r.student_id = u.id 
            SET r.class_id = u.class_id 
            WHERE r.class_id IS NULL
        `);

        console.log('Populating class_id for existing term_remarks...');
        await pool.query(`
            UPDATE term_remarks tr 
            JOIN users u ON tr.student_id = u.id 
            SET tr.class_id = u.class_id 
            WHERE tr.class_id IS NULL
        `);

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
