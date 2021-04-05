function a(link) {
   $('.tab').addClass('collapse');
   $('.nav-link').prop('disabled', false);
   //this.setAttribute('disabled');
   $(link).removeClass('collapse');
}

// onselect name=time_id value=instantaneous -> nam=duration set value=0;

var coll = document.getElementsByClassName("collapsible");
var i;
for (i = 0; i < coll.length; i++) {
   coll[i].addEventListener("click", function() {
      this.classList.toggle("active");
      var content = this.nextElementSibling;
      if (content.style.display === "block") {
         content.style.display = "none";
      } else {
         content.style.display = "block";
      }
   });
}

function ucwords(str) {
   const words = str.split(" ");
   for (let i = 0; i < words.length; i++) {
      words[i] = words[i][0].toUpperCase() + words[i].substr(1);
   }
   return words.join(" ");
}
   
   function responseHandler(res) {
      console.log(res);
      $.each(res.rows, function (i, row) {
         //console.log("row name: " + row.name);
         //console.log("row casting_time: " + row.casting_time);
         row.source = ucwords(row.source);
         row.school = ucwords(row.school);
         row.casting_time_type = row.casting_time +' '+ ucwords(row.casting_time_type);
         row.duration = ucwords(row.duration);
         //row.save_attack = ucwords(row.save_attack);
         row.lvl = (row.lvl == 0)? 'Cantrip': row.lvl;
         row.range_type = ((row.range)? (row.range + ' ') : '') + row.range_type;
         row.state = 0;
      });
      return res;
   }
   function level(value) {
      if (value == 'Cantrip') return "Cantrip-level ";
      if (value == '1') return value + "st-level ";
      if (value == '2') return value + "nd-level ";
      if (value == '3') return value + "rd-level ";
      return value + "th-level ";
   }
   function detailFormatter(index, row) {
      //console.log(row.component_desc);
      var html = '<b>' + row.name + '</b>' + '</br>' + level(row.lvl) + row.school;
      html += (row.ritual)? " (ritual)":'';
      html += (row.concentration)? " <i class='i-cons'></i>":'';
      html += '</br><b>Casting time:</b> ' + row.casting_time_type;
      html += '</br><b>Range:</b> ' + row.range_type;
      html += '</br><b>Components:</b> ' + row.components;
      if(row.component_desc) html += ' - ' + row.component_desc;
      if(row.consumed) html += " (consumed)";
      html += '</br><b>Duration:</b> ' + row.duration;
      html += '<p>' + row.description + '</p>';
      if(row.higher_desc) {html += '<p><b>At Higher Levels:</b> ' + row.higher_desc + '</p>';}
      return html;
   }
   
   function initTable($table) {
      console.log('initTable called');
      //console.log($table);
      $($table).bootstrapTable('destroy').bootstrapTable({
         height: 550,
         local: "en-US",
         columns: [
            [{
               field: 'state',
               checkbox: true,
               align: "center",
               clickToSelect: false
            }, {
               title: 'spell_id',
               field: 'id',
               visible: false
            }, {
               title: "Level",
               field: "lvl",
               sortable: true,
               align: "center"
            }, {
               title: "Spell Name",
               field: "name",
               sortable: true,
               align: "center"
            }, {
               title: "R/C",
               //field: ["ritual", "concentration"],
               align: "center",
               formatter: (value, row) => {
                  return ((row.ritual)? 'Ritual ' : '') + ((row.concentration)? 'Concentration' : '')
               }
            }, {
               title: "Casting Time",
               field: "casting_time_type",
               sortable: true,
               align: "center"
            }, {
               title: "Source",
               field: "source",
               sortable: true,
               visible: false,
               align: "center"
            }, {
               title: "School",
               field: "school",
               sortable: true,
               visible: false,
               align: "center"
            }, {
               title: "Duration",
               field: "duration",
               sortable: true,
               align: "center"
            }, /*{
               title: "Save/Attack",
               field: "save_attack",
               sortable: true,
               visible: false,
               align: "center"
            },*/ {
               title: "Range",
               field: "range_type",
               sortable: true,
               visible: false,
               align: "center"
            }, {
               title: "Area",
               field: "area",
               sortable: true,
               visible: false,
               align: "center"
            }, {
               title: "Components",
               field: "components", // "component_desc", "consumed"],
               sortable: true,
               visible: false,
               align: "center",
               formatter: (value, row) => {
                  return value + ((row.consumed)? ' (Materials Consumed)' : '') + "</br>" + row.component_desc
               }
            }, {
               title: "Description",
               field: "description",
               sortable: true,
               visible: false,
               align: "center"
            }, {
               title: "Description Higher",
               field: "higher_desc",
               sortable: true,
               visible: false,
               align: "center"
            }/* , {
               title: "Classes",
               field: "classes.class_id",
               visible: false,
               sortable: true,
               align: "center"
         } */]]
      })
   }


   function getIdSelections($table) {
      return $.map($($table).bootstrapTable('getSelections'), function (row) {
         return row.id
      })
   }
var selections = {}

function initTables() {
   console.log('initTables called');
   initTable(this);
   
   const but = $(this).attr('data-toolbar') + ' button';
   $(this).on('check.bs.table uncheck.bs.table ' +
         'check-all.bs.table uncheck-all.bs.table', 
         function () {
      
      //console.log($(but));
      //console.log(this);
      $(but).prop('disabled', !$(this).bootstrapTable('getSelections').length);
      selections[$(this).prop('id')] = getIdSelections(this);
      //console.log(selections);
   })
   $(this).on('all.bs.table', function (e, name, args) {
      //console.log(name, args)
   })
   //console.log($(this).prop('id'));
   if($(this).prop('id').includes('Book')) {
      var parent = this;
      $(but).click(function () {
         var ids = selections[$(parent).prop('id')]
         console.log(ids);
         $.ajax({
            url:"/sk/ToBook?funct=remove&book_id="+$(parent).prop('id').slice(4)+ '&spell_id='+ids,
            type: 'GET'
         }).done(function(res) {
            if(res) {
               $(parent).bootstrapTable('remove', {
                  field: 'id',
                  values: ids
               });
               $(but).prop('disabled', true);
            } else {
               console.log('error');
               console.log(document.cookie);
            }
         });
      })
   } else {
      var parent = this;
      $('#add_menu a').click(function(event) {
         //console.log('add_menu', parent);
         //console.log(selections);
         event.preventDefault();
         $.ajax({
            url: $(this).prop('href') + selections[$(parent).prop('id')],
            type: 'GET'
         }).done(function(res) {
            if(res) {
               $('#Book'+res).each(initTables);
               $(but).prop('disabled', true);
               $(parent).bootstrapTable('uncheckAll');
            } else {
               console.log('error');
               console.log(document.cookie);
            }
         });
      })
   }
}
$(function() { $('table').each(initTables) })