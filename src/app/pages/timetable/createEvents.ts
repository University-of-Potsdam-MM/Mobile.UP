import { Frequency, RRule, Weekday } from 'rrule';
import * as moment from 'moment';
import { ICourse, IEvent } from 'src/app/lib/interfaces_PULS';
import { convertToArray } from 'src/app/lib/util';

export interface IEventRules {
  begin: RRule;
  end: RRule;
}

export interface IEventObject {
  id: number;
  startTime: Date;
  endTime: Date;
  title: string;
  courseDetails: ICourse;
  eventDetails: IEvent;
  color: string;
}

export type IEventSource = IEventObject[];
export interface IWeekDaysMapping {
  [weekday: string]: Weekday;
}
export interface IRhythmMapping {
  [rhyhtm: string]: { freq: Frequency; interval: number };
}

const weekdaysMapping: IWeekDaysMapping = {
  Montag: RRule.MO,
  Dienstag: RRule.TU,
  Mittwoch: RRule.WE,
  Donnerstag: RRule.TH,
  Freitag: RRule.FR,
  Samstag: RRule.SA,
  Sonntag: RRule.SU,
};

const rhythmMapping: IRhythmMapping = {
  wöchentlich: {
    freq: RRule.WEEKLY,
    interval: 1,
  },
  '14-täglich': {
    freq: RRule.WEEKLY,
    interval: 2,
  },
  Einzel: {
    // can be treated as weekly event that occurs in a single week
    freq: RRule.WEEKLY,
    interval: 1,
  },
  Einzeltermin: {
    // can be treated as weekly event that occurs in a single week
    freq: RRule.WEEKLY,
    interval: 1,
  },
  Block: {
    freq: RRule.DAILY,
    interval: 1,
  },
};

function pulsToUTC(date, time, second = '00') {
  const day = date.substr(0, 2);
  const month = date.substr(3, 2);
  const year = date.substr(6);

  const hour = time.substr(0, 2);
  const minute = time.substr(3);

  return new Date(
    Date.UTC(
      parseInt(year, 10),
      parseInt(month, 10) - 1, // need to subtract 1 because month starts at 0
      parseInt(day, 10),
      parseInt(hour, 10),
      parseInt(minute, 10),
      parseInt(second, 10)
    )
  );
}

/**
 * Creates event rrules for the given event and returns IEventRules object
 * containing rrules for begin and end of event on each day
 *
 * @param event
 * @param tzid Id of timezone to be used
 * @returns eventrules
 */
function createEventRules(event: IEvent): IEventRules {
  if (!rhythmMapping[event.rhythm]) {
    throw new Error(
      `[createRule]: Event ${event.eventId}: Unknown rhythm: ${event.rhythm}`
    );
  }
  if (!weekdaysMapping[event.day]) {
    throw new Error(
      `[createRule]: Event ${event.eventId}: Unknown weekday: ${event.day}`
    );
  }
  if (event.startDate === undefined || event.endDate === undefined) {
    throw new Error(
      `[createRule]: Event ${event.eventId}: Missing startTime or endTime`
    );
  }
  if (event.startTime === undefined || event.endTime === undefined) {
    throw new Error(
      `[createRule]: Event ${event.eventId}: Missing startTime or endTime`
    );
  }

  return {
    // create rule for beginning time on each day the event takes place
    begin: new RRule({
      freq: rhythmMapping[event.rhythm].freq,
      interval: rhythmMapping[event.rhythm].interval,
      byweekday: weekdaysMapping[event.day],
      dtstart: pulsToUTC(event.startDate, event.startTime),
      until: pulsToUTC(event.endDate, '24:00'),
    }),
    // create rule for end time on each day the event takes place
    end: new RRule({
      freq: rhythmMapping[event.rhythm].freq,
      interval: rhythmMapping[event.rhythm].interval,
      byweekday: weekdaysMapping[event.day],
      dtstart: pulsToUTC(event.startDate, event.endTime),
      until: pulsToUTC(event.endDate, '24:00'),
    }),
  } as IEventRules;
}

/**
 * Main function in this file. Uses given courses list to create an EventSource
 * that can be fed to ionic2calendar. Also returns a mapping of courseID to course
 * and eventID to event which can be used to easily get information about courses
 * and events. Also returns a list of courses containgin invalid events that are
 * not usable.
 *
 * @param studentCourses
 * @param tzid Id of timezone to be used
 * @returns IEventSource
 */
export function createEventSource(studentCourses: ICourse[]): IEventSource {
  // the eventSource we will be returning, actually the main result of this function
  const eventSource: IEventSource = new Array<IEventObject>();

  for (const c of studentCourses) {
    if (c && c.events && c.events.event) {
      // this step is necessary because c.events.event can be a single object
      // or an array of objects
      const events = convertToArray(c.events.event);

      // iterate events of this course because there can be more than one
      for (const e of events) {
        try {
          // try to create an EventRule object from the event, if not possible
          // createEventRules will throw an exception. Then the event is pushed
          // to list of invalid events
          const eventRules: IEventRules = createEventRules(e);

          // get all matching events
          const begin = eventRules.begin.all();
          const end = eventRules.end.all();

          // now iterate over all created single dates and combine them into one
          // IEventObject
          for (let i = 0; i < begin.length; i++) {
            if (!moment(begin[i]).isDST()) {
              // compensate daylight saving time
              // 2 hours are added by the calendar
              begin[i].setHours(begin[i].getHours() - 1);
              end[i].setHours(end[i].getHours() - 1);
            } else {
              // for some reason the calendar plugin adds + 2 hours to our begin/end times
              // we have to regulate that
              begin[i].setHours(begin[i].getHours() - 2);
              end[i].setHours(end[i].getHours() - 2);
            }

            eventSource.push({
              id: e.eventId,
              title: c.courseName,
              startTime: begin[i],
              endTime: end[i],
              courseDetails: c,
              eventDetails: e,
            } as IEventObject);
          }
        } catch (error) {
          console.log(
            `[createEventSource]: Could not parse one event for '${c.courseName}' because: '${error}'`
          );
          break;
        }
      }
    }
  }
  return eventSource;
}
