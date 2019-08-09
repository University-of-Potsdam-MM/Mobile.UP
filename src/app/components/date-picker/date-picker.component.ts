import { Component, OnInit, EventEmitter, Output, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';

@Component({
  selector: 'app-date-picker',
  templateUrl: './date-picker.component.html',
  styleUrls: ['./date-picker.component.scss'],
})
export class DatePickerComponent implements OnInit {

  days: any[] = [];
  dayOffset: string;

  @Input() lines: string;
  @Input() inputDate;

  @Output() dayOffsetEmitter: EventEmitter<string> = new EventEmitter<string>();
  @Output() momentObjectEmitter: EventEmitter<any> = new EventEmitter<any>();

  constructor(
    public translate: TranslateService
  ) { }

  ngOnInit() {
    let day_offset = '0'; // offset = 0 so that current date is default
    if (this.inputDate) {
      const current = moment().startOf('day');
      day_offset = String(this.inputDate.startOf('day').diff(current, 'days'));
    }

    this.days = [];
    for (let i = 0; i < 7; i++) {
      const day: Date = new Date();
      day.setDate(day.getDate() + i);
      this.days.push({'lbl': day, 'value': i.toString()});
    }
    this.dayOffset = day_offset;
    this.emitDayChange();
  }

  emitDayChange() {
    this.dayOffsetEmitter.emit(this.dayOffset);

    const momentObject = moment().add(Number(this.dayOffset), 'days');
    this.momentObjectEmitter.emit(momentObject);
  }

}
