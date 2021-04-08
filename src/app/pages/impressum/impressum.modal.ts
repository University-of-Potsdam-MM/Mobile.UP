import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'impressum-modal-page',
  templateUrl: './impressum.modal.html',
})
export class ImpressumModalPage {
  @Input() text;
  @Input() header;

  constructor(private modalCtrl: ModalController) {}

  closeModal() {
    this.modalCtrl.dismiss();
  }
}
