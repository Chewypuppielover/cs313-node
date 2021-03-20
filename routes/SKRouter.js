var express = require('express');
var router = express.Router();
var debug = require('debug')('SK:router');
const { Pool } = require("pg"); // This is the postgres database connection module.
const pool = new Pool({connectionString: process.env.DATABASE_URL, ssl:{rejectUnauthorized: false}});
pool.connect();
var total;
pool.query("SELECT spells.name FROM project2.spells spells", (err, res) => if(err) debug(err); else total = res.rowCount;);


/* GET home page. , spells.save_id*/
router.get('/', (req, res, next) => {res.render('SpellbookKeeper');});
router.get('/updateTotal', (req, res, next) => {total++;}
router.get('/data', (req, res, next) => {
   console.log("data called");
   var q = "SELECT spells.name, spells.lvl, sc.name school, so.name source, s.name save_attack, ct.name casting_time_type, spells.casting_time, spells.duration, spells.concentration, spells.ritual, spells.range, spells.range_type, spells.area, spells.components, spells.component_desc, spells.consumed, spells.description, spells.higher_desc FROM project2.spells spells LEFT JOIN project2.schools sc ON spells.school_id = sc.id LEFT JOIN project2.sources so ON spells.source_id = so.id LEFT JOIN project2.lengths ct ON spells.casting_time_id = ct.id LEFT OUTER JOIN project2.saves_attacks s ON spells.save_id = s.id WHERE spells.name ILIKE '%"+req.query.search+"%' ORDER BY name";
   debug(q);
   pool.query(q, (err, result) => {
      if(err) debug("err: "+err);
      else {
         for(var key in result.rows) debug(result.rows[key]['name']);
         res.json({"total": result.rowCount,
                  "totalNotFiltered": total,
                  "rows": result.rows});
         //debug(JSON.stringify(result));
      }
   });
});

module.exports = router;
