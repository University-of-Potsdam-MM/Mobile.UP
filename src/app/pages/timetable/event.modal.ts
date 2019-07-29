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

    isArray = Array.isArray;
    moment = moment;

    @Input() events: IEventObject[] = null;
    @Input() date = null;

    constructor(
        private modalCtrl: ModalController,
        public translate: TranslateService // used in template
    ) { }

    closeModal() {
        this.modalCtrl.dismiss();
    }

    ngOnInit() {
        for (let i = 0; i < this.events.length; i++) {
            const startArray = this.events[i].eventDetails.startDate.split('.');
            const endArray = this.events[i].eventDetails.endDate.split('.');
            this.events[i].eventDetails.startDate = new Date(
                startArray[2],
                startArray[1],
                startArray[0]
            );
            this.events[i].eventDetails.endDate = new Date(
                endArray[2],
                endArray[1],
                endArray[0]
            );
        }
    }
}
