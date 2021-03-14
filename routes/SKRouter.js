var express = require('express');
var router = express.Router();
const { Pool } = require("pg"); // This is the postgres database connection module.
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({connectionString: connectionString});

/* GET home page. */
router.get('/', function(req, res, next) {
   res.render('SpellbookKeeper');
});
router.get('/data', (req, res, next) => {
   pool.query("SELECT sc.name school, so.name source, ct.name casting_time_type, s.name save_attack, spells.name, spells.casting_time, spells.duration, spells.lvl, spells.concentration, spells.ritual, spells.range, spells.range_type, spells.area, spells.components, spells.component_desc, spells.consumed, spells.description, spells.higher_desc, spells.save_id FROM project2.spells spells, project2.schools sc, project2.sources so, project2.lengths ct, project2.saves_attacks s WHERE spells.school_id = sc.id AND spells.source_id = so.id AND spells.casting_time_id = ct.id", (err, result) => {
      console.log(err, result);
      res.json(JSON.stringify(result.rows));
      console.log(JSON.stringify(result.rows));
   });
});

module.exports = router;
