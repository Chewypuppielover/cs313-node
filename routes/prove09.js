var express = require('express');
var router = express.Router();
var debug = require('debug')('cs313-node:prove09');

/* GET home page. */
router.get('/', function(req, res, next) {
   res.render('prove09');
});
router.get('/calc', function(req, res, next) {
   var weight = Number(req.query.weight);
   debug(weight+", "+req.query.type);
   var arr;
   switch (req.query.type) {
      case 'stamp':
         arr = {1:0.55, 2:0.75, 3:0.95, 3.5:1.15};
         debug("stamp "+JSON.stringify(arr));
         break;
      case 'meter':
         arr = {1:0.51, 2:0.71, 3:0.91, 3.5:1.11};
         debug("meter "+JSON.stringify(arr));
         break;
      case 'large':
         arr = {1:1.00, 2:1.20, 3:1.40, 4:1.60, 5:1.80, 
            6:2.00, 7:2.20, 8:2.40, 9:2.60, 10:2.80,
            11:3.00, 12:3.20, 13:3.40};
         debug("large "+JSON.stringify(arr));
         break;
      case 'package':
         arr = {4:4.00, 8:4.80, 12:5.50, 13:6.25};
         debug("package "+JSON.stringify(arr));
         break;
      default:
         arr=false;
         debug("default "+JSON.stringify(arr));
         break;
   }
   if(arr) {
      var multiplier = 0;
      for(var key in arr) {
         debug(key);
         if(weight < key) multiplier = arr[key];
      }
      if(multiplier) {
         fin = weight+" * "+multiplier+" = $"+(weight*multiplier).toFixed(2);
         res.writeHeader(200, {"Content-Type": "text/html"});
         res.end(fin);
      } else {
         fin = weight+" is too heavy for "+req.query.type;
         res.writeHeader(200, {"Content-Type": "text/html"});
         res.end(fin);
      }
   } else {
      fin = "Type was invalid: " + req.query.type;
      res.writeHeader(500, {"Content-Type": "text/html"});
      res.end(fin);
   }
   
});
module.exports = router;
