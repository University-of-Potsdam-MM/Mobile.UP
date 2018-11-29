import {ICourse, IEvent} from "../../library/interfaces_PULS";
import {
  Frequency,
  RRule,
  Weekday
} from 'rrule'

export interface IEventRules {
  begin:RRule;
  end:RRule;
}

export interface IEventObject {
  id:number;
  startTime:Date;
  endTime:Date;
  title:string;
  courseDetails:ICourse;
  eventDetails:IEvent;
}

export type IEventSource = IEventObject[];
export type IWeekDaysMapping = {[weekday:string]:Weekday};
export type IRhythmMapping = {[rhyhtm:string]:{freq:Frequency,interval:number}};

var weekdaysMapping:IWeekDaysMapping = {
  "Montag": RRule.MO,
  "Dienstag": RRule.TU,
  "Mittwoch": RRule.WE,
  "Donnerstag": RRule.TH,
  "Freitag": RRule.FR,
  "Samstag": RRule.SA,
  "Sonntag": RRule.SU,
};

var rhythmMapping:IRhythmMapping = {
  "wöchentlich":{
    freq: RRule.WEEKLY,
    interval: 1
  },
  "14-täglich":{
    freq: RRule.WEEKLY,
    interval: 2
  },
  "Einzel":{
    // can be treated as weekly event that occurs in a single week
    freq: RRule.WEEKLY,
    interval: 1
  },
  "Block":{
    freq: RRule.DAILY,
    interval: 1
  },
};

function pulsToUTC(date, time, second='24'){
  let day = date.substr(0,2);
  let month = date.substr(3, 2);
  let year = date.substr(6);

  let hour = time.substr(0, 2);
  let minute = time.substr(3);

  return new Date(
    Date.UTC(
      parseInt(year),
      parseInt(month)-1, // need to subtract 1 because month starts at 0
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
      parseInt(second)
    )
  );
}

/**
 * Creates event rrules for the given event and returns IEventRules object
 * containing rrules for begin and end of event on each day
 * @param event
 * @param tzid Id of timezone to be used
 * @returns eventrules
 */
function createEventRules(event:IEvent, tzid):IEventRules{

  if(!rhythmMapping[event.rhythm]) {
    throw new Error(`[createRule]: Event ${event.eventId}: Unknown rhythm: ${event.rhythm}`);
  }
  if(!weekdaysMapping[event.day]) {
    throw new Error(`[createRule]: Event ${event.eventId}: Unknown weekday: ${event.day}`);
  }
  if(event.startDate === undefined || event.endDate === undefined){
    throw new Error(`[createRule]: Event ${event.eventId}: Missing startTime or endTime`);
  }
  if(event.startTime === undefined || event.endTime === undefined){
    throw new Error(`[createRule]: Event ${event.eventId}: Missing startTime or endTime`);
  }

  return <IEventRules>{
    // create rule for beginning time on each day the event takes place
    begin: new RRule({
      freq: rhythmMapping[event.rhythm].freq,
      interval: rhythmMapping[event.rhythm].interval,
      byweekday: weekdaysMapping[event.day],
      dtstart: pulsToUTC(event.startDate, event.startTime),
      until: pulsToUTC(event.endDate, '24:00'),
      // tzid: tzid
    }),
    // create rule for end time on each day the event takes place
    end: new RRule({
      freq: rhythmMapping[event.rhythm].freq,
      interval: rhythmMapping[event.rhythm].interval,
      byweekday: weekdaysMapping[event.day],
      dtstart: pulsToUTC(event.startDate, event.endTime),
      until: pulsToUTC(event.endDate, '24:00'),
      // tzid: tzid
    })
  };
}

/**
 * Main function in this file. Uses given courses list to create an EventSource
 * that can be fed to ionic2calendar. Also returns a mapping of courseID to course
 * and eventID to event which can be used to easily get information about courses
 * and events. Also returns a list of courses containgin invalid events that are
 * not usable.
 * @param studentCourses
 * @param tzid Id of timezone to be used
 * @returns IEventSource
 */
export function createEventSource(studentCourses:ICourse[],
                                  tzid:string='Europe/Berlin'):IEventSource{

  // the eventSource we will be returning, actually the main result of this function
  let eventSource:IEventSource = new Array<IEventObject>();

  for(let c of studentCourses){
    // this step is necessary because c.events.event can be a single object
    // or an array of objects
    let events = [];
    if(Array.isArray(c.events.event)){
      events = c.events.event;
    } else {
      events.push(c.events.event);
    }

    // iterate events of this course because there can be more than one
    for(let e of events){
      try{
        // try to create an EventRule object from the event, if not possible
        // createEventRules will throw an exception. Then the event is pushed
        // to list of invalid events
        let eventRules:IEventRules = createEventRules(e, tzid);

        // get all matching events
        let begin = eventRules.begin.all();
        let end = eventRules.end.all();

        // now iterate over all created single dates and combine them into one
        // IEventObject
        for(let i=0; i<begin.length; i++){
          eventSource.push(<IEventObject>{
            id: e.eventId,
            title: c.courseName,
            startTime: begin[i],
            endTime: end[i],
            courseDetails: c,
            eventDetails: e
          })
        }
      } catch(error) {
        console.log(`[createEventSource]: Could not parse one event for '${c.courseName}' because: '${error}'`);
        break;
      }
    }
  }
  return eventSource;
}
