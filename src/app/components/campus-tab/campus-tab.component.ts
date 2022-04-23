import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { SettingsService } from 'src/app/services/settings/settings.service';
import { ICampus } from '../../lib/interfaces';
import { ConfigService } from '../../services/config/config.service';
import { ModalController } from '@ionic/angular';
import { CampusReorderModalPage } from './campus-reorder.modal';
import { Storage } from '@capacitor/storage';

/**
 * Component for displaying a campus menu using ion-segments.
 *
 * @desc when initialized the campusChanged event is emitted containing the
 * default campus. This event is fired every time a campus is selected. The
 * selected campus can also be changed from the outside by using the
 * 'selectedCampus' input.
 */
@Component({
  selector: 'app-campus-tab',
  templateUrl: './campus-tab.component.html',
  styleUrls: ['./campus-tab.component.scss'],
})
export class CampusTabComponent implements OnInit {
  /**
   * is emitted every time the campus is changed and emits the selected campus
   */
  @Output() campusChanged: EventEmitter<ICampus> = new EventEmitter<ICampus>();

  /**
   * @desc list of ICampus object that will be used
   */
  campusList: ICampus[] = [];

  /**
   * @desc holds the currently selected campus object
   */
  _selectedCampus: ICampus;
  listProcessed = false;

  constructor(
    private settings: SettingsService,
    private modalCtrl: ModalController
  ) {}

  /**
   * this input can be used to set the selected campus from outside
   *
   * @param campus
   */
  @Input() set selectedCampus(campus: ICampus) {
    this.selectCampus(campus);
  }

  /**
   * this input can be used to set the selected campus from outside
   *
   * @param campus
   */
  @Input() set selectedCampusNoEmit(campus: ICampus) {
    this.selectCampus(campus, true);
  }

  /**
   * selects the specified campus directly and then emits the campusChanged event
   *
   * @param campus
   */
  selectCampus(campus: ICampus, dontEmit = false) {
    this._selectedCampus = campus;

    if (!dontEmit && this._selectedCampus) {
      this.campusChanged.emit(this._selectedCampus);
    }
  }

  /**
   * selects a campus by it's position in campusList. If index is out of bounds
   * nothing will be done.
   *
   * @param index
   */
  selectCampusByIndex(index: number) {
    if (0 <= index && index < this.campusList.length) {
      this.selectCampus(this.campusList[index]);
    }
  }

  /**
   * selects the next campus if there is a next campus, otherwise does nothing
   */
  selectNextCampus() {
    this.selectCampusByIndex(this.campusList.indexOf(this._selectedCampus) + 1);
  }

  /**
   * selects the previous campus if there is a previous campus, otherwise does
   * nothing
   */
  selectPreviousCampus() {
    this.selectCampusByIndex(this.campusList.indexOf(this._selectedCampus) - 1);
  }

  /**
   * initializes this component
   */
  async ngOnInit() {
    const savedListResult = await Storage.get({ key: 'campusListOrdered' });
    const savedList = JSON.parse(savedListResult.value);

    const configList: ICampus[] = Array.from(ConfigService.config.campus);

    if (!savedList) {
      this.campusList = configList;
    } else {
      // add campus in user-preferred order
      for (const savedItem of savedList) {
        for (const [index, config] of configList.entries()) {
          if (config.pretty_name === savedItem.pretty_name) {
            // add campus-object from config to account for changes
            this.campusList.push(config);
            // remove the added item from the "to add" list
            configList.splice(index, 1);
            break;
          }
        }
      }

      // if there are items left in configList
      // it means these locations are newly added
      // so we still have to add them
      if (configList.length > 0) {
        for (const config of configList) {
          this.campusList.push(config);
        }
      }
    }

    await Storage.set({
      key: 'campusListOrdered',
      value: JSON.stringify(this.campusList),
    });

    this.listProcessed = true;
    this.initCampusTab();
  }

  /**
   * retrieves the default campuses name from settings and sets this campus as
   * selected campus
   */
  async initCampusTab() {
    const defaultCampusName = await this.settings.getSettingValue('campus');
    if (this.campusList) {
      this.selectCampus(
        this.campusList.find((c) => c.pretty_name === defaultCampusName)
      );
    }
  }

  async openModal() {
    const modal = await this.modalCtrl.create({
      backdropDismiss: false,
      component: CampusReorderModalPage,
      componentProps: { campusList: this.campusList },
    });
    modal.present();
    await modal.onWillDismiss();
  }
}
