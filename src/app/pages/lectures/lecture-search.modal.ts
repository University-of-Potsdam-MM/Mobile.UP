import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'lecture-search-modal-page',
  templateUrl: './lecture-search.modal.html',
})
export class LectureSearchModalPage implements OnInit {
  @Input() item;
  @Input() isCourse;
  @Input() name;
  @Input() itemTree;
  hasSubTree;
  headerId;

  showItemTreePath = false;

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {
    if (this.item && this.item.childNodes) {
      this.hasSubTree = true;
    } else {
      this.hasSubTree = false;
    }

    if (this.item && this.item.childNode && this.item.childNode.headerId) {
      this.headerId = this.item.childNode.headerId;
    }
  }

  closeModal() {
    this.modalCtrl.dismiss();
  }

  unescapeHTML(s: string) {
    // replaces &colon; in strings, unescape / decodeURI didnt work (?)
    if (s !== undefined) {
      return s.replace(/&colon;/g, ':');
    } else {
      return '';
    }
  }
}
