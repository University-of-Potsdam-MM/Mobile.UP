import { Component, Input } from '@angular/core';
import * as moment from 'moment';
import { IEventObject } from './createEvents';
import { ModalController } from '@ionic/angular';

/**
 * Component for the modal to be shown when an event is selected
 */

@Component({
    selector: 'event-modal-page',
    templateUrl: './event.modal.html',
})
export class EventModalPage {

    isArray = Array.isArray;
    moment = moment;

    @Input() events: IEventObject[] = null;
    @Input() date = null;

    constructor(private modalCtrl: ModalController) { }

    closeModal() {
        this.modalCtrl.dismiss();
    }
}
