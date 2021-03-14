var express = require('express');
var router = express.Router();
var debug = require('debug')('SK:DBControll');
const { Pool } = require("pg"); // This is the postgres database connection module.
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({connectionString: connectionString});

router.get('/', function(req, res, next) {
   if (req.query.submit == 'delete'){
      pool.query("DROP TABLE IF EXISTS project2.spellbook_relation, project2.spells_by_class, project2.spells, project2.saves_attacks, project2.lengths, project2.classes, project2.schools, project2.sources, project2.books, project2.users", (err, res) => {debug("Query delete returned: " + err);});
   }
   if (req.query.submit == 'create') {
      pool.query("CREATE TABLE project2.users (id SERIAL NOT NULL UNIQUE PRIMARY KEY, username VARCHAR(100) NOT NULL UNIQUE, password VARCHAR(100) NOT NULL, name VARCHAR(100) NOT NULL)", (err, res) => 
      {debug("Query users returned: " + err);
         pool.query("CREATE TABLE project2.books (id SERIAL NOT NULL UNIQUE PRIMARY KEY, name VARCHAR(100) NOT NULL, user_id INT NOT NULL REFERENCES project2.users(id))", (err, res) =>
         {debug("Query books returned: " + err);
            pool.query("CREATE TABLE project2.sources (id SERIAL NOT NULL PRIMARY KEY, name VARCHAR(100) NOT NULL UNIQUE)", (err, res) => 
            {debug("Query sources returned: " + err);
               pool.query("CREATE TABLE project2.schools (id SERIAL NOT NULL UNIQUE PRIMARY KEY, name VARCHAR(100) NOT NULL UNIQUE)", (err, res) => 
               {debug("Query schools returned: " + err);
                  pool.query("CREATE TABLE project2.classes (id SERIAL NOT NULL UNIQUE PRIMARY KEY, name VARCHAR(100) NOT NULL UNIQUE)", (err, res) => 
                  {debug("Query classes returned: " + err);
                     pool.query("CREATE TABLE project2.lengths (id SERIAL NOT NULL UNIQUE PRIMARY KEY, name VARCHAR(100) NOT NULL UNIQUE)", (err, res) =>
                     {debug("Query lengths returned: " + err);
                        pool.query("CREATE TABLE project2.saves_attacks (id SERIAL NOT NULL UNIQUE PRIMARY KEY, name VARCHAR(100) NOT NULL UNIQUE)", (err, res) =>
                        {debug("Query saves returned: " + err);
                           pool.query("CREATE TABLE project2.spells (id SERIAL NOT NULL UNIQUE PRIMARY KEY, name VARCHAR(100) NOT NULL UNIQUE, school_id INT NOT NULL REFERENCES project2.schools(id), source_id INT NOT NULL REFERENCES project2.sources(id), casting_time_id INT NOT NULL REFERENCES project2.lengths(id), save_id INT REFERENCES project2.saves_attacks(id), casting_time INT NOT NULL, duration VARCHAR(100) NOT NULL, lvl SMALLINT NOT NULL, concentration BOOLEAN NOT NULL, ritual BOOLEAN NOT NULL, range INT, range_type VARCHAR(30), area VARCHAR(100), components VARCHAR(7) NOT NULL, component_desc VARCHAR(100), consumed BOOLEAN NOT NULL, description TEXT NOT NULL, higher_desc TEXT)", (err, res) => 
                           {debug("Query spells returned: " + err);
                              pool.query("CREATE TABLE project2.spells_by_class (id SERIAL NOT NULL UNIQUE PRIMARY KEY, class_id INT NOT NULL REFERENCES project2.classes(id), spell_id INT NOT NULL REFERENCES project2.spells(id))", (err, res) => 
                              {debug("Query spells_by_class returned: " + err);
                                 pool.query("CREATE TABLE project2.spellbook_relation (id SERIAL NOT NULL UNIQUE PRIMARY KEY, book_id INT NOT NULL REFERENCES project2.books(id), spell_id INT NOT NULL REFERENCES project2.spells(id))", (err, res) => {debug("Query spellbook returned: " + err);});
      });});});});});});});});});
   }
   if (req.query.submit == 'insert') {
      debug("arrived at insert");
      pool.query("INSERT INTO project2.schools (name) VALUES ('conjuration'), ('necromancy'), ('evocation'), ('abjuration'), ('transmutation'), ('divination'), ('enchantment'), ('illusion')", (err, res) => {debug("Query schools returned: " + err);});
   
      books = ["player's handbook", "elemental evil player's companion", "xanathar's guide to everything", "sword coast adventurer's guide", "explorer's guide to wildemount", "guildmaster's guide to ravnica"];
      pool.query("INSERT INTO project2.sources (name) VALUES ($1), ($2), ($3), ($4), ('acquisitions incorporated'), ($5), ($6), ('lost laboratory of kwalish'), ('unearthed arcana'), ('custom')", books, (err, res) => {debug("Query sources returned: " + err);});
         
      pool.query("INSERT INTO project2.classes (name) VALUES ('artificer'), ('barbarian'), ('bard'), ('cleric'), ('druid'), ('fighter'), ('monk'), ('paladin'), ('ranger'), ('rouge'), ('sourcerer'), ('warlock'), ('wizard'), ('blood hunter')", (err, res) => {debug("Query returned: " + err);});
      pool.query("INSERT INTO project2.lengths (name) VALUES ('action'), ('bonus action'), ('reaction'), ('rounds'), ('years'), ('days'), ('hours'), ('minutes'), ('seconds'), ('instantaneous')", (err, res) => {debug("Query classes returned: " + err);});
      pool.query("INSERT INTO project2.saves_attacks (name) VALUES ('dex save'), ('str save'), ('con save'), ('int save'), ('wis save'), ('char save'), ('melee'), ('ranged')", (err, res) => {debug("Query saves returned: " + err);});
   }
   if (req.query.submit == 'json') {
      var fs = require('fs');
      fs.readFile('private/spellData.json', 'utf8', function(err, data) {
         var data1;
         if (err) throw err;
         else (data1 = JSON.parse(data, true));
         res.write("</br>Spells: ");
         for(var spellKey in data1) {
            var spell = data1[spellKey];
            debug(spell);
            for(var key in spell) {
               res.write(key + ": " + spell[key] + "</br>");
               var s = spell['page'].split(' ')[0];
               var source_id = (s == 'ee' ? "elemental evil player's companion" : (s == 'phb' ? "player's handbook" : "sword coast adventurer's guide"));
               var c = spell['casting_time'].toLowerCase().split(' ');
               var casting_id = c.slice(1).join(' ');
               //if(end(c) != 'action' && c[strlen(c[0])-1] != 's') casting_id += 's';
               var lvl = (Number.isInteger(spell['level'][0])? spell['level'][0]:0);
               var consumed = spell['material']? spell['material'].match('/(gp)/'):'';
               var r = spell['range'].split(' ');
               var range_num = (Number.isInteger(r[0]) ? r[0] : 0);
               res.write('<b>source_id:</b> ' + source_id + '</br>');
               res.write('<b>casting_id:</b> ' + casting_id + '</br>');
               res.write('<b>lvl:</b> ' + lvl + '</br>');
               res.write('<b>consumed:</b> ' + consumed + '</br>');
               res.write('<b>range_num:</b> ' + range_num + '</br>');
               
               var values = [spell['name'], spell['school'].toLowerCase(), source_id, casting_id, c[0], spell['duration'], lvl, spell['components'], (spell['concentration'] == 'yes' ? true : false), (spell['ritual'] == 'yes' ? true : false), consumed, range_num, r[r.length-1], (spell['material']? spell['material'] :''), spell['desc'], (spell['higher_level']? spell['higher_level'] :'')];
               debug(values);
               pool.query("INSERT INTO project2.spells (name, school_id, source_id, casting_time_id, casting_time, duration, lvl, concentration, ritual, range, range_type, components, component_desc, consumed, description, higher_desc) VALUES ($1, (SELECT id FROM project2.schools WHERE name=$2), (SELECT id FROM project2.sources WHERE name=$3), (SELECT id FROM project2.lengths WHERE name=$4), $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)", values, (err, res) => {debug("Query json returned: " + err);});
            }
         }
      });
      /* $json = file_get_contents('spellData.json');
      //print_r($json);
      $spells = json_decode($json, true);
      //echo "</br>Spells: ";
      //print_r($spells);
      foreach($spells as $spell) {
         foreach($spell as $key => $value) echo $key . ': ' . $value . '</br>';
         $s = explode(' ', $spell['page'])[0];
         $source_id = ($s == 'ee' ? "elemental evil player's companion" : ($s == 'phb' ? "player's handbook" : "sword coast adventurer's guide"));
         $c = explode(' ', strtolower($spell['casting_time']));
         $casting_id = implode(' ', array_slice($c, 1));
         //if(end($c) != 'action' && $c[strlen($c[0])-1] != 's') $casting_id += 's';
         $lvl = (ctype_digit($spell['level'][0])? $spell['level'][0]:0);
         $consumed = preg_match('/(gp)/', $spell['material']);
         $r = explode(' ', $spell['range']);
         $range_num = (ctype_digit($r[0]) ? $r[0] : 0);
         echo '<b>source_id:</b> ' . $source_id . '</br>';
         echo '<b>casting_id:</b> ' . $casting_id . '</br>';
         echo '<b>lvl:</b> ' . $lvl . '</br>';
         echo '<b>consumed:</b> ' . $consumed . '</br>';
         echo '<b>range_num:</b> ' . $range_num . '</br>';
         
         $query = pool.prepare('INSERT INTO project2.spells (name, school_id, source_id, casting_time_id, casting_time, duration, lvl, concentration, ritual, range, range_type, components, component_desc, consumed, description, higher_desc) 
         VALUES (:name, (SELECT id FROM project2.schools WHERE name=:school_id),
         (SELECT id FROM project2.sources WHERE name=:source_id),
         (SELECT id FROM project2.lengths WHERE name=:casting_id),
         :casting_time, :duration, :lvl, :con, :ritual, :range, :range_type, :components, :component_desc, :consumed, :description, :higher_desc)');
         $query -> bindValue(':name', $spell['name'], PDO::PARAM_STR);
         $query -> bindValue(':school_id', strtolower($spell['school']), PDO::PARAM_STR);
         $query -> bindValue(':source_id', $source_id, PDO::PARAM_STR);
         $query -> bindValue(':casting_id', $casting_id, PDO::PARAM_STR);
         $query -> bindValue(':casting_time', $c[0], PDO::PARAM_INT);
         $query -> bindValue(':duration', $spell['duration'], PDO::PARAM_STR);
         $query -> bindValue(':lvl', $lvl, PDO::PARAM_INT);
         $query -> bindValue(':components', $spell['components'], PDO::PARAM_STR);
         $query -> bindValue(':con', ($spell['concentration'] == 'yes' ? true : false), PDO::PARAM_BOOL);
         $query -> bindValue(':ritual', ($spell['ritual'] == 'yes' ? true : false), PDO::PARAM_BOOL);
         $query -> bindValue(':consumed', $consumed, PDO::PARAM_BOOL);
         $query -> bindValue(':range', $range_num, PDO::PARAM_INT);
         $query -> bindValue(':range_type', end($r), PDO::PARAM_STR);
         $query -> bindValue(':component_desc', ($spell['material']?:''), PDO::PARAM_STR);
         $query -> bindValue(':description', $spell['desc'], PDO::PARAM_STR);
         $query -> bindValue(':higher_desc', ($spell['higher_level']?:''), PDO::PARAM_STR);
         $query->execute();
      } */
   }
   res.send("<form method='GET'> <input type='submit' name='submit' value='delete'> <input type='submit' name='submit' value='create'> <input type='submit' name='submit' value='insert'> <input type='submit' name='submit' value='json'> </form>");
});

module.exports = router;