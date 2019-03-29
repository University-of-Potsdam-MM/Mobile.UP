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

  title: string;
  descriptionItems: string[];

  constructor(private modalCtrl: ModalController) {
  }

  ngOnInit() {
    // if (props['description']) {
    //   // replace corrupted newline with correct <br> tag
    //   props.description = props.description.replace(/(\r\n|\n|\r)/gm, '<br/>');
    // }

    if (this.feature.properties.description) {
      this.descriptionItems = this.feature.properties.description.split('-');
      console.log(this.feature.properties.description);
    } else {
      this.descriptionItems = [];
    }
  }

  closeModal() {
    this.modalCtrl.dismiss();
  }

}
