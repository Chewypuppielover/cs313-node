var express = require('express');
var router = express.Router();
var debug = require('debug')('SK:DBControll');
var debugCreate = require('debug')('SK:DBControll-create');
var debugInsert = require('debug')('SK:DBControll-insert');
var debugJson = require('debug')('SK:DBControll-json');
const { Pool } = require("pg"); // This is the postgres database connection module.
const pool = new Pool({connectionString: process.env.DATABASE_URL, ssl:{rejectUnauthorized: false}});
const bcrypt = require('bcrypt');
let adminHash;
bcrypt.genSalt(10, function(err, salt) {
   bcrypt.hash('admin', salt, function(err, hash) { 
      if(err) debug(err);
      else adminHash = hash;
   });
});

var users = ["CREATE TABLE project2.users (" +
   "id SERIAL NOT NULL UNIQUE PRIMARY KEY, " +
   "username VARCHAR(100) NOT NULL UNIQUE, " +
   "password VARCHAR(100) NOT NULL, " +
   "name VARCHAR(100) NOT NULL)",
   "INSERT INTO project2.users (username, password, name) VALUES ('admin', $1, 'ADMIN'), ('noone', 'none', 'No One')"];

var spellBooks = "CREATE TABLE project2.books (" +
   "id SERIAL NOT NULL UNIQUE PRIMARY KEY, " +
   "name VARCHAR(100) NOT NULL, " +
   "user_id INT NOT NULL REFERENCES project2.users(id))";
   
var sources = "CREATE TABLE project2.sources (" +
   "id SERIAL NOT NULL PRIMARY KEY, " +
   "name VARCHAR(100) NOT NULL UNIQUE)";
   
var schools = ["CREATE TABLE project2.schools (" +
   "id SERIAL NOT NULL UNIQUE PRIMARY KEY, " +
   "name VARCHAR(100) NOT NULL UNIQUE)",
   "INSERT INTO project2.schools (name) VALUES " +
   "('conjuration'), ('necromancy'), ('evocation'), ('abjuration'), " + 
   "('transmutation'), ('divination'), ('enchantment'), ('illusion')"];
   
var classes = "CREATE TABLE project2.classes (" +
   "id SERIAL NOT NULL UNIQUE PRIMARY KEY, " +
   "name VARCHAR(100) NOT NULL UNIQUE)";
   
var lengths = "CREATE TABLE project2.lengths (" +
   "id SERIAL NOT NULL UNIQUE PRIMARY KEY, " +
   "name VARCHAR(100) NOT NULL UNIQUE)";
   
var saves = "CREATE TABLE project2.saves_attacks (" +
   "id SERIAL NOT NULL UNIQUE PRIMARY KEY, " +
   "name VARCHAR(100) NOT NULL UNIQUE)";

var spells = "CREATE TABLE project2.spells (" +
   "id SERIAL NOT NULL UNIQUE PRIMARY KEY, " +
   "user_id INT NOT NULL REFERENCES project2.users(id), " +
   "name VARCHAR(100) NOT NULL UNIQUE, " +
   "school_id INT NOT NULL REFERENCES project2.schools(id), " +
   "source_id INT NOT NULL REFERENCES project2.sources(id), " +
   "casting_time_id INT NOT NULL REFERENCES project2.lengths(id), " +
   "save_id INT REFERENCES project2.saves_attacks(id), " +
   "casting_time INT NOT NULL, " +
   "duration VARCHAR(100) NOT NULL, " +
   "lvl SMALLINT NOT NULL, " +
   "concentration BOOLEAN NOT NULL, " +
   "ritual BOOLEAN NOT NULL, " +
   "range INT, " +
   "range_type VARCHAR(30), " +
   "area VARCHAR(100), " +
   "components VARCHAR(7) NOT NULL, " +
   "component_desc VARCHAR(200), " +
   "consumed BOOLEAN NOT NULL, " +
   "description TEXT NOT NULL, " +
   "higher_desc TEXT)";

var spells_by_class = "CREATE TABLE project2.spells_by_class (" +
   "id SERIAL NOT NULL UNIQUE PRIMARY KEY, " +
   "class_id INT NOT NULL REFERENCES project2.classes(id), " +
   "spell_id INT NOT NULL REFERENCES project2.spells(id))";

var spellBook = "CREATE TABLE project2.spellbook_relation (" +
   "id SERIAL NOT NULL UNIQUE PRIMARY KEY, " +
   "book_id INT NOT NULL REFERENCES project2.books(id), " +
   "spell_id INT NOT NULL REFERENCES project2.spells(id))";

var deleteAll = "DROP TABLE IF EXISTS project2.spellbook_relation, " +
   "project2.spells_by_class, project2.spells, project2.saves_attacks, " +
   "project2.lengths, project2.classes, project2.schools, project2.sources, " +
   "project2.books, project2.users";
/*
if (req.query.submit == 'create') {
      pool.query(users, (err, res) => {
         debug("Query users returned: " + err);
         pool.query(spellBooks, (err, res) => {
            debug("Query spellBooks returned: " + err);
            pool.query(sources, (err, res) => {
               debug("Query sources returned: " + err);
               pool.query(schools, (err, res) => {
                  debug("Query schools returned: " + err);
                  pool.query(classes, (err, res) => {
                     debug("Query classes returned: " + err);
                     pool.query(lengths, (err, res) => {
                        debug("Query lengths returned: " + err);
                        pool.query(saves, (err, res) => {
                           debug("Query saves returned: " + err);
                           pool.query(spells, (err, res) => {
                              debug("Query spells returned: " + err);
                              pool.query(spells_by_class, (err, res) => {
                                 debug("Query spells_by_class returned: " + err);
                                 pool.query(spellBook, (err, res) => {debug("Query spellbook returned: " + err);});
      });});});});});});});});});
   }
*/

router.get('/', function(req, res, next) {
   if (req.query.submit == 'delete'){
      pool.query(deleteAll, (err, resp) => {
         debug("Query delete returned: ");
         if(err) debug(err); 
         else debug(resp.command);
      });
   }
   
   if (req.query.submit == 'create') {
      var count = 0;
      var create1 = function() { count++; if(count == 6) create2(); };
      //create1
      pool.query(users[0], (err, res) => {
         debugCreate("Query users[0] returned: "); debugCreate(err);
         pool.query(users[1], [adminHash], (err, res) => { debugCreate("Query users[1] returned: "); debugCreate(err); });
         pool.query(spellBooks, (err, res) => { debugCreate("Query spellBooks returned: "); debugCreate(err); create1(); });
      });
      pool.query(sources, (err, res) => { debugCreate("Query sources returned: "); debugCreate(err); create1(); });
      pool.query(schools[0], (err, res) => { debugCreate("Query schools returned: "); debugCreate(err); create1(); });
      pool.query(classes, (err, res) => { debugCreate("Query classes returned: "); debugCreate(err); create1(); });
      pool.query(lengths, (err, res) => { debugCreate("Query lengths returned: "); debugCreate(err); create1(); });
      pool.query(saves, (err, res) => { debugCreate("Query saves returned: "); debugCreate(err); create1(); });
      function create2() { //create2
         pool.query(spells, (err, res) => { 
            debugCreate("Query spells returned: "); debugCreate(err);
            //create3
            pool.query(spells_by_class, (err, res) => { debugCreate("Query spells_by_class returned: "); debugCreate(err); });
            pool.query(spellBook, (err, res) => {debugCreate("Query spellbook returned: "); debugCreate(err);});
         });
      }
   }
   
   if (req.query.submit == 'insert') {
      debugInsert("arrived at insert");
      pool.query(schools[1], (err, res) => {debugInsert("Query schools returned: " + err);});
   
      books_in = ["player's handbook", "elemental evil player's companion", "xanathar's guide to everything", "sword coast adventurer's guide", "explorer's guide to wildemount", "guildmaster's guide to ravnica"];
      pool.query("INSERT INTO project2.sources (name) VALUES ($1), ($2), ($3), ($4), ('acquisitions incorporated'), ($5), ($6), ('lost laboratory of kwalish'), ('unearthed arcana'), ('custom')", books_in, (err, res) => {debugInsert("Query sources returned: " + err);});
         
      pool.query("INSERT INTO project2.classes (name) VALUES ('artificer'), ('barbarian'), ('bard'), ('cleric'), ('druid'), ('fighter'), ('monk'), ('paladin'), ('ranger'), ('rouge'), ('sorcerer'), ('warlock'), ('wizard'), ('blood hunter')", (err, res) => {debugInsert("Query returned: " + err);});
      pool.query("INSERT INTO project2.lengths (name) VALUES ('action'), ('bonus action'), ('reaction'), ('rounds'), ('years'), ('days'), ('hours'), ('minutes'), ('seconds'), ('instantaneous')", (err, res) => {debugInsert("Query classes returned: " + err);});
      pool.query("INSERT INTO project2.saves_attacks (name) VALUES ('dex save'), ('str save'), ('con save'), ('int save'), ('wis save'), ('char save'), ('melee'), ('ranged')", (err, res) => {debugInsert("Query saves returned: " + err);});
   }
   if (req.query.submit == 'json') {
      var fs = require('fs');
      fs.readFile('private/spellData.json', 'utf8', function(err, data) {
         var data1;
         if (err) throw err;
         else (data1 = JSON.parse(data, true));
         //res.write("</br>Spells: ");
         for(var spellKey in data1) { //for(var spellKey = 0; spellKey < 6; spellKey++) { 
            var spell = data1[spellKey];
            //debug(spell);
            //for(var key in spell) res.write(key + ": " + spell[key] + "</br>");
            var s = spell['page'].split(' ')[0];
            var source_id = (s == 'ee' ? "elemental evil player's companion" : (s == 'phb' ? "player's handbook" : "sword coast adventurer's guide"));
            var c = spell['casting_time'].toLowerCase().split(' ');
            var casting_id = c.slice(1).join(' ');
            if(!c[c.length-1].match(/action/) && casting_id[casting_id.length-1] != 's') casting_id += 's';
            var lvl = (spell['level'][0].match(/\d/)? spell['level'][0]:0);
            var consumed = spell['material']? spell['material'].match(/(gp)/):false;
            var r = spell['range'].split(' ');
            var range_num = (r[0].match(/\d/) ? r[0] : 0);
            // res.write('<b>source_id:</b> ' + source_id + '</br>');
            // res.write('<b>casting_id:</b> ' + casting_id + '</br>');
            // res.write('<b>lvl:</b> ' + lvl + '</br>');
            // res.write('<b>consumed:</b> ' + consumed + '</br>');
            // res.write('<b>range_num:</b> ' + range_num + '</br>');
            
            var values = [spell['name'], spell['school'].toLowerCase(), source_id, casting_id, c[0], spell['duration'], lvl, (spell['concentration'] == 'yes' ? true : false), (spell['ritual'] == 'yes' ? true : false), range_num, r[r.length-1], spell['components'], (spell['material']? spell['material'] :''), Boolean(consumed), spell['desc'], (spell['higher_level']? spell['higher_level'] :'')];
            debugJson(c, casting_id, c[c.length-1][this.length-1]);
            pool.query("INSERT INTO project2.spells (user_id, name, school_id, source_id, casting_time_id, casting_time, duration, lvl, concentration, ritual, range, range_type, components, component_desc, consumed, description, higher_desc) VALUES (1, $1, (SELECT id FROM project2.schools WHERE name=$2), (SELECT id FROM project2.sources WHERE name=$3), (SELECT id FROM project2.lengths WHERE name=$4), $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)", values, (err, res) => {debugJson(res + "Query json returned: " + err);});
         }
      });
   }
   res.send("<form method='GET'> <input type='submit' name='submit' value='delete'> <input type='submit' name='submit' value='create'> <input type='submit' name='submit' value='insert'> <input type='submit' name='submit' value='json'> </form>");
});

module.exports = router;