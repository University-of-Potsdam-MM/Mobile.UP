import { OnInit, Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
    selector: 'lecture-search-modal-page',
    templateUrl: './lecture-search.modal.html',
})
export class LectureSearchModalPage implements OnInit {

    @Input() item;
    @Input() isCourse;
    @Input() name;
    hasSubTree;
    headerId;

    constructor(
        private modalCtrl: ModalController
    ) {
    }

    ngOnInit() {
        if (this.item.childNodes) {
            this.hasSubTree = true;
        } else { this.hasSubTree = false; }

        if (this.item && this.item.childNode && this.item.childNode.headerId) {
            this.headerId = this.item.childNode.headerId;
        }
    }

    closeModal() {
        this.modalCtrl.dismiss();
    }
}
