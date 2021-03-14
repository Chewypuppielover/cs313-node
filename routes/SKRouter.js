var express = require('express');
var router = express.Router();
var debug = require('debug')('SK:router');
const { Pool } = require("pg"); // This is the postgres database connection module.
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({connectionString: connectionString});

/* GET home page. */
router.get('/', function(req, res, next) {
   res.render('SpellbookKeeper');
});
router.get('/data', (req, res, next) => {
   pool.query("SELECT s.name save_attack, sc.name school, so.name source, ct.name casting_time_type, spells.name, spells.casting_time, spells.duration, spells.lvl, spells.concentration, spells.ritual, spells.range, spells.range_type, spells.area, spells.components, spells.component_desc, spells.consumed, spells.description, spells.higher_desc, spells.save_id FROM project2.spells spells LEFT JOIN project2.schools sc ON spells.school_id = sc.id LEFT JOIN project2.sources so ON spells.source_id = so.id LEFT JOIN project2.lengths ct ON spells.casting_time_id = ct.id LEFT OUTER JOIN project2.saves_attacks s ON spells.save_id = s.id ORDER BY name", (err, result) => {
      if(err) debug("err: "+err);
      else {
         for(var key in result.rows) debug(result.rows[key]['name']);
         res.json(result.rows);
         //console.log(JSON.stringify(result.rows));
      }
   });
});

module.exports = router;
