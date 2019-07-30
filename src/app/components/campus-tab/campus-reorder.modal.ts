import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ICampus } from 'src/app/lib/interfaces';


@Component({
  selector: 'campus-modal-page',
  templateUrl: './campus-reorder.modal.html',
  styleUrls: ['../../components/campus-tab/campus-tab.component.scss'],
})
export class CampusReorderModalPage {

  @Input() campusList: ICampus[];

  constructor(
      private modalCtrl: ModalController
    ) { }

  closeModal() {
    this.modalCtrl.dismiss({
       'newList': this.campusList
    });
  }

  doReorder(ev: any) {
    // The `from` and `to` properties contain the index of the item
    // when the drag started and ended, respectively

    // reorders the list
    this.campusList.splice(ev.detail.to, 0, this.campusList.splice(ev.detail.from, 1)[0]);

    // Finish the reorder
    ev.detail.complete();
  }

}
