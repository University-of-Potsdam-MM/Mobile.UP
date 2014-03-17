$(document).on("pageinit", "#opening", function () {

          var date_helper = {
            // I give this function a German name,
            // because someone introduced German weekday names as keys in opening.json
            tage: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
            wochentag: function(date) {
              if (date) {
                return this.tage[date.getDay()]
              }
            },
            hoursColonMinutes: function(date){
              if (date) {
                return date.getHours() + ':' + date.getMinutes();
              }
            },
            openingForWochentag: function(timesArr, wochentag) {
              if (! _.isArray(timesArr)){ return;}
              var day = _.find(timesArr, function(timesForDay){
                //console.log('find day', wochentag, timesArr, timesForDay);
                return timesForDay.day == wochentag;
              });
              if (day){
                return day.opening;
              }
              return false;
            },
            statusAtPlaceAndDate: function(place, date) {
              if (date && place) {
                var _wochentag = this.wochentag(date);
                var opening = this.openingForWochentag(place.times, _wochentag);

                if (opening === false) {
                  return 'closed';
                };

                if ((opening == null) || _.isString(opening)) {
                  return 'notsure';
                };

                var time = this.hoursColonMinutes(date);
                if (_.isArray(opening)) {
                  var open = _.some(opening, function(fromTo){
                    return ((fromTo[0] < time) && (fromTo[1] > time))
                  });
                  return (open)? 'open' : 'closed';
                }

                return 'problem'
              }
            },
          };

          var renderOpenings = function(openings) {
            var placeTemplate = rendertmpl('openings');
            var placesList = $('#openings > ul');
            _.each(openings, function(place){
              placesList.append(placeTemplate(place));
            });
          };

          var fromToDaytimeString = function(from, to) {
            var string = '' + from + ' - ' + to + ' Uhr';
            // console.log('string',string);
            return string;
          };

          var addTextToTimes = function (openings) {
            _.each(openings, function(place) {
              // console.log('place',place);
              _.each(place.times, function(day){
                // console.log('day', day);
                if(_.isString(day.opening)) {
                  day.opening_text = day.opening;
                  return;
                }

                if(_.isArray(day.opening)){
                  var text = _.map(day.opening, function(fromToArr){
                    // console.log('fromToArr', fromToArr);
                    if (_.isArray(fromToArr)) {
                      return fromToDaytimeString(fromToArr[0], fromToArr[1]);
                    } else {
                      return fromToArr;
                    }
                  }).join(' | ');
                  day.opening_text = text;
                  // console.log('text', text);
                  return;
                }

                //console.log('Neither String nor Array');
              })
            });
            return openings;
          };

          $.ajax({
            url: 'js/json/opening.json',
            method: 'GET',
            dataType: 'html',
            async: false,
            success: function(json) {
              var data = $.parseJSON(json);
              var openings = _.sortBy(data, 'name');

              openings = addTextToTimes(openings);

              var now = new Date();
              _.each(openings, function(place){
                place.statusOpenNow = date_helper.statusAtPlaceAndDate(place, now);
              });

              //console.log(openings);
              renderOpenings(openings);
              $("#opening").trigger("create");
            }
          });
        });