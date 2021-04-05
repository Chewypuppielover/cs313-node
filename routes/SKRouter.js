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
pool.query("SELECT COUNT(spells.name) FROM project2.spells spells", (err, res) => {if(err) debug(err); else total = res.rows[0][0];});

/* GET home page. , spells.save_id*/
router.get('/', (req, res, next) => {
   //debug('cookies at main:', JSON.stringify(req.cookies));
   res.clearCookie('account-error');
   var count = 0;
   var dropdown = function() { count++; if(count == 6) doRender(); };
   var schools, saves, lengths, sources, classes;
   function doRender() { res.render('SpellbookKeeper', {'account':req.cookies.account, schools, saves, lengths, sources, classes}); }
   pool.query("SELECT id, name FROM project2.schools", (err, res) => {if(err) debug(err); else schools = res.rows; dropdown();});
   pool.query("SELECT id, name FROM project2.sources", (err, res) => {if(err) debug(err); else sources = res.rows; dropdown();});
   pool.query("SELECT id, name FROM project2.classes", (err, res) => {if(err) debug(err); else classes = res.rows; dropdown();});
   pool.query("SELECT id, name FROM project2.lengths", (err, res) => {if(err) debug(err); else lengths = res.rows; dropdown();});
   pool.query("SELECT id, name FROM project2.saves_attacks", (err, res) => {if(err) debug(err); else saves = res.rows; dropdown();});
   if(req.cookies.account && !req.cookies.account.books) {
      pool.query("SELECT name, id FROM project2.books WHERE user_id = $1", [req.cookies.account.id], (err, result) => {
         if(err) debug(err); else {
            debugDB('books Query returned:');
            debugDB(result.rows);
            req.cookies.account['books'] = result.rows;
            res.cookie('account', req.cookies.account);
         }
      dropdown(); });
   } else dropdown();
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

router.get('/SpellData', (req, res, next) => {
   debugData("data called");
   var q = "SELECT spells.name, spells.id, spells.lvl, sc.name school, so.name source, s.name save_attack, ct.name casting_time_type, spells.casting_time, spells.duration, spells.concentration, spells.ritual, spells.range, spells.range_type, spells.area, spells.components, spells.component_desc, spells.consumed, spells.description, spells.higher_desc FROM project2.spells spells LEFT JOIN project2.schools sc ON spells.school_id = sc.id LEFT JOIN project2.sources so ON spells.source_id = so.id LEFT JOIN project2.lengths ct ON spells.casting_time_id = ct.id LEFT OUTER JOIN project2.saves_attacks s ON spells.save_id = s.id WHERE (spells.user_id = 1";
   if(req.cookies.account) q += " OR spells.user_id = " + req.cookies.account.id + ')'; else q+=')';
   //q += ' OR spells.user_id = 2)';
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
      req.body['area']];
   if(req.cookies.account) ins.push(req.cookies.account.id); else ins.push(2);
   //debug(ins);
   if(req.body.save) {
      //debug(insertSave); 
      ins.push(req.body['save']);
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

router.get('/BookData', (req, res, next) => {
   pool.query("SELECT r.spell_id FROM project2.spellbook_relation r " +
         "LEFT JOIN project2.books b ON r.book_id = b.id " +
         "WHERE b.id = $1", [req.query.id], (err, result) => {
      if(err) debugDB(err); else {
         if(result.rowCount) {
            var list = [];
            result.rows.forEach(function(value, key) {
               debug(value.spell_id);
               list.push(value.spell_id);
            });
            q = "SELECT spells.name, spells.id, spells.lvl, sc.name school, so.name source, s.name save_attack, ct.name casting_time_type, spells.casting_time, spells.duration, spells.concentration, spells.ritual, spells.range, spells.range_type, spells.area, spells.components, spells.component_desc, spells.consumed, spells.description, spells.higher_desc FROM project2.spells spells LEFT JOIN project2.schools sc ON spells.school_id = sc.id LEFT JOIN project2.sources so ON spells.source_id = so.id LEFT JOIN project2.lengths ct ON spells.casting_time_id = ct.id LEFT OUTER JOIN project2.saves_attacks s ON spells.save_id = s.id WHERE spells.id IN (" + list + ")";
            if(req.query.search) q += " AND spells.name ILIKE '%"+req.query.search+"%'";
            q += " ORDER BY " 
            if(req.query.sort) q += req.query.sort + " " + req.query.order + ', ';
            q += 'name';
            debugDB(q);
            pool.query(q, (err, result) => {if(err) debugDB(err); else { //debugDB(result);
               var end = Number(req.query.offset) + Number(req.query.limit);
               res.json({"total": result.rowCount,
                     "totalNotFiltered": result.rowCount,
                     "rows": result.rows.slice(req.query.offset, end)});
            } });
         } else res.json();
      }
   });
});
router.get('/newBook', (req, res, next) => {
   debug(req.query.name, req.cookies.account.id);
   pool.query("INSERT INTO project2.books (name, user_id) VALUES ($1, $2) RETURNING id", [req.query.name, req.cookies.account.id],
   (err, result) => {if(err) debug(err); else {
      debugDB(result);
      var book = {name:req.query.name, id:result.rows[0].id};
      req.cookies.account.books.push(book) ;
      res.cookie('account', req.cookies.account);
      res.redirect('/sk');
   }});
});
router.get('/removeBook', (req, res, next) => {
   debug(req.query.book_id, req.cookies.account.id);
   pool.query("DELETE FROM project2.books WHERE id = $1", [req.query.book_id],
   (err, result) => {if(err) debug(err); else {
      debugDB(result);
      debug(req.cookies.account.books);
      req.cookies.account.books.forEach(function(val, key) {
         if(val.id == req.query.book_id) req.cookies.account.books.splice(key, 1);
      });
      debug(req.cookies.account.books);
      res.cookie('account', req.cookies.account);
      res.redirect('/sk');
   }});
});

router.get('/ToBook', (req, res, next) => {
   if(req.query.funct == 'add') {
      var q = "INSERT INTO project2.spellbook_relation (book_id, spell_id) VALUES";
      var ins = [req.query.book_id];
      req.query.spell_id.split(',').forEach(function(x, k) {
         ins.push(x);
         q += " ($1, $"+(k+2)+"),"
      });
      debugDB(q.slice(0, -1));
      pool.query(q.slice(0, -1), ins,
      (err, result) => { if(err) debugDB(err); else res.json(req.query.book_id); });
   }
   if(req.query.funct == 'remove') {
      var q = "DELETE FROM project2.spellbook_relation WHERE book_id = "+req.query.book_id+" AND spell_id IN ("+req.query.spell_id+')';
      debugDB(q);
      pool.query(q, (err, result) => { if(err) debugDB(err); else res.json(true); });
   }
});

module.exports = router;