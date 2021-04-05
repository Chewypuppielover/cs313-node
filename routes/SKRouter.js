var express = require('express');
var router = express.Router();
var debug = require('debug')('SK:router');
var debugDB = require('debug')('SK:router-DB');
var debugData = require('debug')('SK:router-Data');
const { Pool } = require("pg"); // This is the postgres database connection module.
const pool = new Pool({connectionString: process.env.DATABASE_URL, ssl:{rejectUnauthorized: false}});
pool.connect();
const bcrypt = require('bcrypt');
var total;
pool.query("SELECT spells.name FROM project2.spells spells", (err, res) => {if(err) debug(err); else total = res.rowCount;});

/* GET home page. , spells.save_id*/
router.get('/', (req, res, next) => {
   debug('cookies at main:', JSON.stringify(req.cookies));
   res.clearCookie('account-error');
   //res.clearCookie('test1');
   var count = 0;
   var dropdown = function() { count++; if(count == 5) doRender(); };
   var schools, saves, lengths, sources, classes;
   function doRender() { res.render('SpellbookKeeper', {'account':req.cookies.account, schools, saves, lengths, sources, classes}); }
   pool.query("SELECT id, name FROM project2.schools", (err, res) => {if(err) debug(err); else schools = res.rows; dropdown();});
   pool.query("SELECT id, name FROM project2.sources", (err, res) => {if(err) debug(err); else sources = res.rows; dropdown();});
   pool.query("SELECT id, name FROM project2.classes", (err, res) => {if(err) debug(err); else classes = res.rows; dropdown();});
   pool.query("SELECT id, name FROM project2.lengths", (err, res) => {if(err) debug(err); else lengths = res.rows; dropdown();});
   pool.query("SELECT id, name FROM project2.saves_attacks", (err, res) => {if(err) debug(err); else saves = res.rows; dropdown();});
});
router.use('/sus', require('../private/SpellbookKeeper'));
router.post('/signIn', (req, res, next) => {
   //res.cookie('account', {'name': 'Suzy', 'id':2});
   res.clearCookie('account-error');
   pool.query("SELECT password, name, id FROM project2.users WHERE username = $1", [req.body.username],
   function(err, result) {
      if (err) debugDB("Error in user query: " + err);
      else {
         debugDB("Query for users returned:");
         debugDB(result.rows);
         if(result.rows[0]) {
            debug("result exists");
            bcrypt.compare(req.body.pass, result.rows[0].password, function(err, match) {
               if(err) debug(err);
               if(match) {
                  res.cookie('account', {'name':result.rows[0].name, 'id':result.rows[0].id});
                  res.json(result.rows[0].name);
               } else { res.cookie('account-error', "wrong password"); debug('failed on password'); res.send(); }
            });
         } else { res.cookie('account-error', "no account with that username"); debug('failed on username'); res.send(); }
      }
      //debug('cookies after sign in: ' + JSON.stringify(res.cookies));
   });
});
router.get('/signOut', (req, res, next) => { res.clearCookie('account'); res.clearCookie('account-error'); res.redirect('/sk'); });
router.post('/signUp', (req, res, next) => {
   res.clearCookie('account-error');
   bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(req.body.pass, salt, (err, hash) => {
         pool.query("INSERT INTO project2.users (username, password, name) VALUES ($1, $2, $3) RETURNING id", 
         [req.body.username, hash, req.body.name], (err, result) => {
            debugDB('Query to insert user returned: ');
            if(err) {
               debugDB('insert user ' + err);
               res.cookie('account-error', 'username taken');
               res.send();
            } else {
               debugDB(result.rows);
               res.cookie('account', {'name':req.body.name, 'id':result.rows[0].id});
               res.json(req.body.name);
            }
         });
      });
   });
});

// router.get('/mybooks', (req, res, next) => {res.render('SpellbookKeeper');});
// router.get('/manage', (req, res, next) => {res.render('SpellbookKeeper');});
router.get('/updateTotal', (req, res, next) => {total++;});
router.get('/data', (req, res, next) => {
   debugData("data called");
   var q = "SELECT spells.name, spells.lvl, sc.name school, so.name source, s.name save_attack, ct.name casting_time_type, spells.casting_time, spells.duration, spells.concentration, spells.ritual, spells.range, spells.range_type, spells.area, spells.components, spells.component_desc, spells.consumed, spells.description, spells.higher_desc FROM project2.spells spells LEFT JOIN project2.schools sc ON spells.school_id = sc.id LEFT JOIN project2.sources so ON spells.source_id = so.id LEFT JOIN project2.lengths ct ON spells.casting_time_id = ct.id LEFT OUTER JOIN project2.saves_attacks s ON spells.save_id = s.id WHERE (spells.user_id = 1";
   //if(req.cookie.user) q += " OR spells.user_id = " + req.cookie.user_id + ')'; else 
   q += ' OR spells.user_id = 2)';
   if(req.query.search) q += " AND spells.name ILIKE '%"+req.query.search+"%'";
   q += " ORDER BY " 
   if(req.query.sort) q += req.query.sort + " " + req.query.order + ', ';
   q += 'name';
   
   debugData(q);
   pool.query(q, (err, result) => {
      if(err) debugDB("err: "+err);
      else {
         var end = Number(req.query.offset) + Number(req.query.limit);
         debugData(end);
         var rows = result.rows.slice(req.query.offset, end);
         for(var key in rows) debugData(rows[key]['name']);
         res.json({"total": result.rowCount,
                  "totalNotFiltered": total,
                  "rows": rows});
      }
   });
});

router.use('/newSpell', (req, res, next) => {
   var insertSave = "INSERT INTO project2.spells (name, school_id, source_id, casting_time_id, casting_time, duration, lvl, concentration, ritual, range, range_type, components, component_desc, consumed, description, higher_desc, area, user_id, save_id) " +
   "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)";
   var insert = 'INSERT INTO project2.spells (name, school_id, source_id, casting_time_id, casting_time, duration, lvl, concentration, ritual, range, range_type, components, component_desc, consumed, description, higher_desc, area, user_id) ' +
   'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)';
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
      req.body['area'], 2];
   //debug(ins);
   if(req.body.save) {
      //debug(insertSave); 
      ins[18] = req.body['save'];
      pool.query(insertSave, ins, (err, result) => {
         if(err) { debug("query Error: "); debug(err); }
         else { res.write("Spell added successfully"); total++; }
         //debug(result);
      });
   } else {
      //debug(insert);
      pool.query(insert, ins, (err, result) => {
         if(err) { debug("query Error: "); debug(err); }
         else { res.end("Spell added successfully"); total++; }
         //debug(result);
      });
   }
});

module.exports = router;