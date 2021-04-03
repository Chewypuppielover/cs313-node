var express = require('express');
var router = express.Router();
var debug = require('debug')('SK:router');
var debugDB = require('debug')('SK:router-DB');
const { Pool } = require("pg"); // This is the postgres database connection module.
const pool = new Pool({connectionString: process.env.DATABASE_URL, ssl:{rejectUnauthorized: false}});
pool.connect();
var total;
pool.query("SELECT spells.name FROM project2.spells spells", (err, res) => {if(err) debug(err); else total = res.rowCount;});

/* GET home page. , spells.save_id*/
router.get('/', (req, res, next) => {
   var count = 0;
   var dropdown = function() { count++; if(count == 5) doRender(); };
   var schools, saves, lengths, sources, classes;
   function doRender() { res.render('SpellbookKeeper', {schools, saves, lengths, sources, classes}); }
   pool.query("SELECT id, name FROM project2.schools", (err, res) => {if(err) debug(err); else schools = res.rows; dropdown();});
   pool.query("SELECT id, name FROM project2.sources", (err, res) => {if(err) debug(err); else sources = res.rows; dropdown();});
   pool.query("SELECT id, name FROM project2.classes", (err, res) => {if(err) debug(err); else classes = res.rows; dropdown();});
   pool.query("SELECT id, name FROM project2.lengths", (err, res) => {if(err) debug(err); else lengths = res.rows; dropdown();});
   pool.query("SELECT id, name FROM project2.saves_attacks", (err, res) => {if(err) debug(err); else saves = res.rows; dropdown();});
});
// router.get('/mybooks', (req, res, next) => {res.render('SpellbookKeeper');});
// router.get('/manage', (req, res, next) => {res.render('SpellbookKeeper');});
router.get('/updateTotal', (req, res, next) => {total++;});
router.get('/data', (req, res, next) => {
   debugDB("data called");
   var q = "SELECT spells.name, spells.lvl, sc.name school, so.name source, s.name save_attack, ct.name casting_time_type, spells.casting_time, spells.duration, spells.concentration, spells.ritual, spells.range, spells.range_type, spells.area, spells.components, spells.component_desc, spells.consumed, spells.description, spells.higher_desc FROM project2.spells spells LEFT JOIN project2.schools sc ON spells.school_id = sc.id LEFT JOIN project2.sources so ON spells.source_id = so.id LEFT JOIN project2.lengths ct ON spells.casting_time_id = ct.id LEFT OUTER JOIN project2.saves_attacks s ON spells.save_id = s.id";
   if(req.query.search) q += " WHERE spells.name ILIKE '%"+req.query.search+"%'";
   q += " ORDER BY " 
   if(req.query.sort) q += req.query.sort + " " + req.query.order + ', ';
   q += 'name';
   
   debugDB(q);
   pool.query(q, (err, result) => {
      if(err) debug("err: "+err);
      else {
         var end = Number(req.query.offset) + Number(req.query.limit);
         debugDB(end);
         var rows = result.rows.slice(req.query.offset, end);
         for(var key in rows) debugDB(rows[key]['name']);
         res.json({"total": result.rowCount,
                  "totalNotFiltered": total,
                  "rows": rows});
      }
   });
});

router.post('/newSpell', (req, res, next) => {
   var insertSave = "INSERT INTO project2.spells (name, school_id, source_id, casting_time_id, casting_time, duration, lvl, concentration, ritual, range, range_type, components, component_desc, consumed, description, higher_desc, area, save_id) " +
   "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)";
   var insert = 'INSERT INTO project2.spells (name, school_id, source_id, casting_time_id, casting_time, duration, lvl, concentration, ritual, range, range_type, components, component_desc, consumed, description, higher_desc, area) ' +
   'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)';
   //debug(req.body);
   
   var comp;
   try { comp = req.body['components[]'].join(", "); }
   catch(e) { 
      if (e instanceof TypeError) comp = req.body['components[]'];
      else console.error(e);
   }
   
   /* var ins = [
      components : comp,
      name : req.body['name'],
      school_id : req.body['school'],
      source_id : req.body['source'],
      casting_id : req.body['cast_id'],
      casting_time : req.body['casting_time'],
      duration : req.body['duration'],
      lvl : req.body['level'],
      con : Boolean(req.body['con']),
      ritual : Boolean(req.body['ritual']),
      consumed : Boolean(req.body['consumed']),
      range : req.body['range'],
      range_type : req.body['range_type'],
      component_desc : req.body['com_desc'],
      description : req.body['description'],
      higher_desc : req.body['higher_desc'],
      area : req.body['area'],
      save : req.body['save']
   ]; */
   //TODO: return more pretty
   var ins = [req.body['name'], req.body['school'], req.body['source'],
      req.body['cast_id'], req.body['casting_time'], req.body['duration'],
      req.body['level'], Boolean(req.body['con']), Boolean(req.body['ritual']),
      req.body['range'], req.body['range_type'], comp, req.body['com_desc'],
      Boolean(req.body['consumed']), req.body['description'], req.body['higher_desc'],
      req.body['area']];
   //debug(ins);
   if(req.body.save) {
      //debug(insertSave); 
      ins[17] = req.body['save'];
      pool.query(insertSave, ins, (err, result) => {
         if(err) { debug("query Error: "); debug(err); }
         else { res.write("Spell added successfully"); total++; }
         //debug(result);
      });
   } else {
      //debug(insert);
      pool.query(insert, ins, (err, result) => {
         if(err) { debug("query Error: "); debug(err); }
         else { res.end("Spell added successfully"); total++ }
         //debug(result);
      });
   }
});


module.exports = router;