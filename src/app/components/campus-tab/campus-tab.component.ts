import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Events } from '@ionic/angular';
import { SettingsService } from 'src/app/services/settings/settings.service';
import { ICampus } from '../../lib/interfaces';
import { ConfigService } from '../../services/config/config.service';

/**
 * Component for displaying a campus menu using ion-segments.
 * @desc when initialized the campusChanged event is emitted containing the
 * default campus. This event is fired every time a campus is selected. The
 * selected campus can also be changed from the outside by using the
 * 'selectedCampus' input.
 */
@Component({
  selector: 'app-campus-tab',
  templateUrl: './campus-tab.component.html',
  styleUrls: ['./campus-tab.component.scss']
})
export class CampusTabComponent implements OnInit {

  /**
   * is emitted every time the campus is changed and emits the selected campus
   */
  @Output() campusChanged: EventEmitter<ICampus> = new EventEmitter<ICampus>();

  /**
   * this input can be used to set the selected campus from outside
   * @param campus
   */
  @Input() set selectedCampus(campus: ICampus) {
    this.selectCampus(campus);
  }

  /**
   * @desc list of ICampus object that will be used
   */
  campusList: ICampus[] = ConfigService.config.campus;

  /**
   * @desc holds the currently selected campus object
   */
  _selectedCampus: ICampus;

  constructor(
    private settings: SettingsService,
    private swipeEvent: Events
  ) {  }

  /**
   * selects the specified campus directly and then emits the campusChanged event
   * @param campus
   */
  selectCampus(campus: ICampus) {
    this._selectedCampus = campus;
    this.campusChanged.emit(this._selectedCampus);
  }

  /**
   * selects a campus by it's position in campusList. If index is out of bounds
   * nothing will be done.
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
    this.selectCampusByIndex(this.campusList.indexOf(this.selectedCampus) + 1);
  }

  /**
   * selects the previous campus if there is a previous campus, otherwise does
   * nothing
   */
  selectPreviousCampus() {
    this.selectCampusByIndex(this.campusList.indexOf(this.selectedCampus) - 1);
  }

  /**
   * initializes this component
   */
  ngOnInit() {
    this.initSwipeEvents();
    this.initCampusTab();
  }

  /**
   * initializes the swipe events for this component
   */
  initSwipeEvents() {
    this.swipeEvent.subscribe('campus-swipe-to-right',
      () => { this.selectNextCampus(); }
    );

    this.swipeEvent.subscribe('campus-swipe-to-left',
      () => { this.selectPreviousCampus(); }
    );
  }

  /**
   * retrieves the default campuses name from settings and sets this campus as
   * selected campus
   */
  async initCampusTab() {
    const defaultCampusName = await this.settings.getSettingValue('campus');
    this.selectCampus(
      this.campusList.find(c =>  c.pretty_name === defaultCampusName)
    );
  }
}
