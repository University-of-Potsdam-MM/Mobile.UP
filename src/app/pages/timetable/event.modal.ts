import { Component, Input, OnInit } from '@angular/core';
import * as moment from 'moment';
import { IEventObject } from './createEvents';
import { ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

/**
 * Component for the modal to be shown when an event is selected
 */

@Component({
  selector: 'event-modal-page',
  templateUrl: './event.modal.html',
})
export class EventModalPage implements OnInit {
  @Input() events: IEventObject[] = null;
  @Input() date = null;

  isArray = Array.isArray;
  moment = moment;

  constructor(
    private modalCtrl: ModalController,
    public translate: TranslateService // used in template
  ) {}

  closeModal() {
    this.modalCtrl.dismiss();
  }

  ngOnInit() {
    if (this.events) {
      for (const event of this.events) {
        if (
          event.eventDetails &&
          event.eventDetails.startDate &&
          event.eventDetails.endDate
        ) {
          const startArray = event.eventDetails.startDate.split('.');
          const endArray = event.eventDetails.endDate.split('.');

          if (startArray.length > 2) {
            event.eventDetails.startDate = new Date(
              startArray[2],
              startArray[1] - 1, // Javascript dates range from 0-11
              startArray[0]
            );
          }

          if (endArray.length > 2) {
            event.eventDetails.endDate = new Date(
              endArray[2],
              endArray[1] - 1, // Javascript dates range from 0-11
              endArray[0]
            );
          }
        }
      }
    }
  }
}
