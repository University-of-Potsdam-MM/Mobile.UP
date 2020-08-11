import { Component, OnInit, Input } from '@angular/core';
import { INewsEventsObject } from 'src/app/lib/interfaces';
import * as moment from 'moment';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-event-view',
  templateUrl: './event-view.component.html',
  styleUrls: ['./event-view.component.scss']
})
export class EventViewComponent implements OnInit {

  @Input() public event: INewsEventsObject;
  dateString;
  eventVenue;
  showDescription = false;

  constructor(
    public translate: TranslateService
  ) { }

  ngOnInit() {
    const eventBegin = moment.unix(Number(this.event.Event.startTime));
    const eventEnd = moment.unix(Number(this.event.Event.endTime));

    this.dateString = eventBegin.format('dd., Do MMM YY, LT');
    if (this.translate.currentLang == 'de') { this.dateString += ' Uhr '; }

    if (eventBegin.format('MMM Do YY') === eventEnd.format('MMM Do YY')) {
      this.dateString += '– ' + eventEnd.format('LT');
    } else { this.dateString += '– ' + eventEnd.format('dd., Do MMM YY, LT'); }

    if (this.translate.currentLang == 'de') { this.dateString += ' Uhr'; }

    this.eventVenue = this.event.Event.venue.replace('findet, online', 'findet online').replace('., ,', '.');
  }

  toggleDescription() {
    this.showDescription = !this.showDescription;
  }

}
