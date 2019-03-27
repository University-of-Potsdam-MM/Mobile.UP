import {Component, Input, OnInit} from '@angular/core';
import {Feature} from 'geojson';
import {ModalController} from '@ionic/angular';

@Component({
  selector: 'app-campus-map-feature-modal',
  templateUrl: './campus-map-feature-modal.component.html',
  styleUrls: ['./campus-map-feature-modal.component.scss']
})
export class CampusMapFeatureModalComponent implements OnInit {

  @Input() feature: Feature;

  constructor(private modalCtrl: ModalController) { }

  ngOnInit() {}

  closeModal() {
    this.modalCtrl.dismiss();
  }

}
