/* eslint-disable @typescript-eslint/dot-notation */
import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {
  Geolocation,
  PermissionStatus,
  Position,
} from '@capacitor/geolocation';
import { Keyboard } from '@capacitor/keyboard';
import { IonSearchbar, ModalController, Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import * as L from 'leaflet';
import { LatLngExpression } from 'leaflet';
import 'leaflet-rotatedmarker';
import 'leaflet-search';
import { AbstractPage } from 'src/app/lib/abstract-page';
import {
  ICampus,
  IMapsResponse,
  IMapsResponseObject,
} from 'src/app/lib/interfaces';
import { AlertService } from 'src/app/services/alert/alert.service';
import { CampusMapFeatureModalComponent } from '../../components/campus-map-feature-modal/campus-map-feature-modal.component';
import { CampusTabComponent } from '../../components/campus-tab/campus-tab.component';
import { ConfigService } from '../../services/config/config.service';
import { WebserviceWrapperService } from '../../services/webservice-wrapper/webservice-wrapper.service';

export interface CampusMapQueryParams {
  campus?: string | number;
  feature?: string;
  coordinates?: LatLngExpression;
}

@Component({
  selector: 'app-campus-map',
  templateUrl: './campus-map.page.html',
  styleUrls: ['./campus-map.page.scss'],
})
export class CampusMapPage extends AbstractPage implements OnInit, OnDestroy {
  @ViewChild(CampusTabComponent, { static: false })
  campusTab: CampusTabComponent;

  @ViewChild(IonSearchbar, { static: false })
  ionSearchbar: IonSearchbar;

  campusList: ICampus[] = ConfigService.config.campus;
  currentCampus: ICampus;
  geoJSON: IMapsResponseObject[];
  searchControl;
  searchableLayers: L.LayerGroup = L.layerGroup();
  map: L.Map;
  query = '';
  scrollListenerAdded = false;

  positionCircle: L.Circle;
  positionMarker: L.Marker;
  modalOpen = false;

  isLoaded;

  geoLocationEnabled = false;
  watchPositionCallbackID;

  constructor(
    private ws: WebserviceWrapperService,
    private translate: TranslateService,
    private modalCtrl: ModalController,
    private alertService: AlertService,
    private http: HttpClient,
    public platform: Platform
  ) {
    super({ requireNetwork: true });
  }

  ngOnInit() {
    this.map = this.initializeLeafletMap();

    // if the currentCampus has been set already, move there
    if (this.currentCampus) {
      this.moveToCampus(this.currentCampus);
    }

    this.loadMapData(this.map);
  }

  ngOnDestroy() {
    this.clearWatchGeolocation();
  }

  /**
   * @name loadMap
   * @description loads map and initializes it
   */
  initializeLeafletMap() {
    // create map object
    const map = L.map('map');
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '© <a href="//www.openstreetmap.org/copyright" target="_blank">OpenStreetMap-Mitwirkende</a> und www.uni-potsdam.de',
      minZoom: 10,
      maxZoom: 18,
    }).addTo(map);

    return map;
  }

  /**
   * implementation of abstract page function
   *
   * @param params
   */
  handleQueryParams(params: CampusMapQueryParams) {
    // this.logger.entry('handleQueryParams', params);
    if (params.coordinates) {
      this.moveToPosition(params.coordinates);
    }

    if (params.feature) {
      this.moveToFeature(params.feature);
    }

    if (params.campus) {
      this.moveToQueriedCampus(params.campus);
    }
  }

  /**
   * @name addLeafletSearch
   * @desc Adds the leaflet search control to the map. Will only work if
   * this.searchableLayers is already populated with geoJSON objects.
   */
  addLeafletSearch(map) {
    this.searchControl = new L.Control['Search']({
      layer: this.searchableLayers,
      propertyName: 'searchProperty',
      collapsed: false,
      textErr: this.translate.instant('page.campus-map.no_results'),
      textCancel: this.translate.instant('page.campus-map.cancel'),
      textPlaceholder: this.translate.instant(
        'page.campus-map.placeholder_search'
      ),
      initial: false,
      minLength: 3,
      filterData: (text, records) => {
        // Filters records based on search input
        this.scrollListenerAdded = false;
        let frecords = [];
        // text = text.replace(/[.*+?^${}()|[\]\\]/g, '');  // Sanitize remove all special characters

        if (text === '') {
          return [];
        }

        let testtext = text;
        let test = '';
        let hilf = '';
        // Matches "Haus <Nr.>"
        hilf = testtext.match(/haus \d{1,2}/i);
        if (hilf && hilf[0] !== '') {
          if (hilf[0].length === 7) {
            test += hilf[0] + '|' + '\\d\\.' + hilf[0].slice(-2);
          } else {
            test += hilf[0] + '|' + '\\d\\.0' + hilf[0][5];
          }
          // Removes "Haus" from search query as it is not necessarily part of the searchProperty (name + description + campus name)
          testtext = testtext.replace(/Haus /i, ' ');
        }
        hilf = '';
        // Matches house numbers, formats them correctly and removes room numbers
        hilf = testtext.match(
          /(\d{1,2}\.\d{1,2}\.\d{1,2})|(\d{1,2}\.\d{1,2})/i
        );
        if (hilf && hilf[0] !== '') {
          const hilf2 = hilf[0].split('.');
          if (test !== '') {
            test += '|';
          }
          test += hilf2[0].slice(-1) + '\\.' + ('0' + hilf2[1]).slice(-2);
          if (hilf2.length === 2) {
            test += '|\\d\\.' + ('0' + hilf2[0]).slice(-2);
          }
        }
        // CARE: maybe limit the amount of characters that can be entered in the input box to prevent too long strings
        if (test !== '') {
          test += '|';
        }
        // Matches records that have every word of the search query in them
        test +=
          '\\?(?=(.|\\n)*' +
          testtext.trim().split(' ').join(')(?=(.|\\n)*') +
          ')';
        const I = this.searchControl.options.initial ? '^' : ''; // search only initial text
        const icase = !this.searchControl.options.casesensitive
          ? 'i'
          : undefined;

        const regSearch = new RegExp(I + test, icase);

        // TODO use .filter or .map (from _defaultFilterData in /node_modules/leaflet-search/scr/leaflet-search.js))
        for (const key in records) {
          if (regSearch.test('?' + key)) {
            frecords[key] = records[key];
          }
        }

        // convert object to array, so that we can sort results later on
        frecords = Object.keys(frecords).map(function (key) {
          const tmp = [];
          tmp[0] = [];
          tmp[0][0] = key;
          tmp[0][1] = frecords[key];
          return tmp;
        });

        // if there are no search results, show a toast alert
        if (frecords.length === 0) {
          this.alertService.showToast('page.campus-map.no_results');
        } else {
          // sort results, so that results for current campus go first
          frecords.sort((a, b) => {
            const campusA = a[0][1].layer.feature.properties.campus.pretty_name;
            const campusB = b[0][1].layer.feature.properties.campus.pretty_name;
            const currentCampus = this.currentCampus.pretty_name;

            if (campusA === currentCampus && !(campusB === currentCampus)) {
              return -1;
            } else if (
              campusB === currentCampus &&
              !(campusA === currentCampus)
            ) {
              return 1;
            }

            return 0;
          });
        }

        const result = {};
        for (const fr of frecords) {
          result[fr[0][0]] = fr[0][1];
        }

        return result;
      },
      autoType: false, // guess that would just annoy most users,
      buildTip: (text, val) => {
        const tip = L.DomUtil.create('li', '');
        const properties = val.layer.feature.properties;
        if (properties.Name) {
          let content = `<div id="tooltip-title">${properties.Name}`;

          if (properties.campus && properties.campus.pretty_name) {
            content += ` (${properties.campus.pretty_name})`;
          }

          content += '</div>';

          if (properties.description) {
            content += `<div id="tooltip-description">${properties.description.replace(
              /\n/g,
              '<br>'
            )}</div>`;
          }

          tip.innerHTML = content;
          L.DomUtil.addClass(tip, 'search-tip');

          // adds a scroll-listener on mobile devices to hide the keyboard when scrolling search results
          if (
            !this.scrollListenerAdded &&
            (this.platform.is('ios') || this.platform.is('android'))
          ) {
            const list = document.getElementsByClassName('search-tooltip');

            if (list && list[0]) {
              const onScrollListener = async () => {
                if (this.platform.is('ios') || this.platform.is('android')) {
                  Keyboard.hide();
                  const searchbar = await this.ionSearchbar.getInputElement();
                  searchbar.blur();
                }
              };

              list[0].addEventListener('scroll', onScrollListener);
              this.scrollListenerAdded = true;
            }
          }

          tip['_text'] = content;
        }

        return tip;
      },
      moveToLocation: (latlng, title) => {
        // move map to selected search result, with default zoom = 16
        this.map.setView(latlng, 16);

        // set currentCampus to match what the map displays
        for (const campus of this.campusList) {
          if (title.includes(campus.pretty_name)) {
            this.currentCampus = campus;
          }
        }
      },
    });
    map.addControl(this.searchControl);
  }

  search() {
    this.searchControl.searchText(this.query);
  }

  toggleGeolocation() {
    if (!this.geoLocationEnabled) {
      this.watchGeolocation();
    } else {
      this.clearWatchGeolocation();
    }
  }

  async watchGeolocation() {
    let currentStatus: PermissionStatus = {
      location: 'prompt',
      coarseLocation: 'prompt',
    };
    if (this.platform.is('ios') || this.platform.is('android')) {
      currentStatus = await Geolocation.checkPermissions();

      if (currentStatus.location !== 'granted') {
        currentStatus = await Geolocation.requestPermissions();
      }
    } else {
      currentStatus.location = 'granted';
    }

    if (currentStatus.location === 'granted') {
      this.geoLocationEnabled = true;
      this.watchPositionCallbackID = await Geolocation.watchPosition(
        { enableHighAccuracy: true },
        (position: Position | null, err?: any) => {
          if (position) {
            this.setPosition(position);
            this.moveToPosition([
              position.coords.latitude,
              position.coords.longitude,
            ]);
          }
        }
      );
    }
  }

  async clearWatchGeolocation() {
    if (this.watchPositionCallbackID) {
      await Geolocation.clearWatch({ id: this.watchPositionCallbackID });
      this.watchPositionCallbackID = null;
      this.geoLocationEnabled = false;
    }

    if (this.positionCircle) {
      this.map.removeLayer(this.positionCircle);
    }

    if (this.positionMarker) {
      this.map.removeLayer(this.positionMarker);
    }
  }

  /**
   * @name setPosition
   * @desc adds a leaflet circle to the map at the given position with a radius
   * fitting the positions accuracy. Also adds a marker if we know where the device
   * is heading.
   * @param position {Position}
   */
  setPosition(position: Position) {
    // remove existing circle, if there is one
    if (this.positionCircle) {
      this.map.removeLayer(this.positionCircle);
    }
    if (this.positionMarker) {
      this.map.removeLayer(this.positionMarker);
    }

    this.positionCircle = L.circle(
      [position.coords.latitude, position.coords.longitude],
      {
        color: 'blue',
        fillColor: '#0000ff',
        fillOpacity: 0.5,
        radius: position.coords.accuracy ? position.coords.accuracy : 10,
      }
    );
    this.positionCircle.addTo(this.map);
  }

  /**
   * @name loadMapData
   * @description loads campus map data from cache
   */
  loadMapData(map) {
    this.ws.call('maps').subscribe(
      (response: IMapsResponse) => {
        this.geoJSON = response;
        this.isLoaded = true;
        this.addFeaturesToLayerGroups(this.geoJSON, map);
      },
      () => {
        this.http
          .get('assets/json/geojson.json')
          .subscribe((response: IMapsResponse) => {
            this.geoJSON = response;
            this.isLoaded = true;
            this.addFeaturesToLayerGroups(this.geoJSON, map);
          });
      }
    );
  }

  /**
   * selects the given campus and sets fitBounds to the campus' bounds
   *
   * @param {ICampus} campus
   */
  selectCampus(campus: ICampus) {
    this.currentCampus = campus;
    if (this.map) {
      this.moveToCampus(campus);
    }
  }

  /**
   * moves to given campus
   *
   * @param campus {ICampus}
   */
  moveToCampus(campus: ICampus) {
    this.map.fitBounds(campus.lat_long_bounds);
  }

  /**
   * Finds a campus by query. Campus can be specified in multiple ways:
   *  - location_id (as string or number)
   *  - name
   *  - pretty_name
   *
   * @description fits map to given campus
   * @param {string | name} query
   */
  queryCampus(query: string | number) {
    if (ConfigService.config.campus) {
      return ConfigService.config.campus.find(
        (campus: ICampus) =>
          campus.location_id === query ||
          campus.location_id === query.toString() ||
          campus.name === query ||
          campus.pretty_name === query
      );
    } else {
      return undefined;
    }
  }

  /**
   * Queries the desired campus and moves there if it can be found
   *
   * @param query
   */
  moveToQueriedCampus(query: string | number) {
    const foundCampus = this.queryCampus(query);
    if (foundCampus) {
      // this.logger.info(`moving to campus ${foundCampus.pretty_name}`);
      this.selectCampus(foundCampus);
    } else {
      // this.logger.error(`could not find campus by query: '${query}'`);
    }
  }

  /**
   * move map to given feature, if it exists
   */
  moveToFeature(feature) {
    console.log(feature);
  }

  /**
   * flys to given coordinates
   *
   * @param coordinates
   */
  moveToPosition(coordinates: LatLngExpression) {
    // this.logger.entry('moveToPosition', coordinates);
    this.map.panTo(coordinates);
  }

  /**
   * @name addFeaturesToLayerGroups
   * @description adds features of geoJSON to layerControl and adds those layerGroups
   * to the map by default
   */
  addFeaturesToLayerGroups(geoJSON: IMapsResponse, map: L.Map) {
    // just used to remember which categories we've seen already
    const categories: string[] = [];

    // create a mapping of campusName to ICampus object
    const campusMapping = {};
    for (const c of this.campusList) {
      campusMapping[c.name] = c;
    }

    // this object will be populated next and then added to the map
    const overlays: { [name: string]: L.LayerGroup } = {};

    for (const obj of geoJSON) {
      // create correct category string
      const category = this.translate.instant(
        'page.campus-map.category.' + obj.category
      );

      // check if we already have this category in our overlays
      if (categories.indexOf(obj.category) === -1) {
        // Create new LayerGroup for each unique category
        overlays[category] = L.layerGroup();
        // Push category name so we know we already got that one
        categories.push(obj.category);
      }

      // add features from each category to corresponding layer
      for (const geofeature of obj.geo.features) {
        const props = geofeature.properties;

        // create new property that can easily be searched by leaflet-search
        props['campus'] = campusMapping[obj.campus];
        props['category'] = category;
        const searchString = `${props.Name} ${
          props.description ? props.description : ''
        } (${props.campus.pretty_name})`;
        props['searchProperty'] = searchString.replace(/[\r\n]+/gm, '');
        props['code'] = ``;

        const geoJson = L.geoJSON(geofeature);

        // add click listener that will open a Modal displaying some information
        geoJson.on('click', async () => {
          if (!this.modalOpen) {
            this.modalOpen = true;

            if (props.campus !== this.currentCampus) {
              this.currentCampus = props.campus;
            }

            const modal = await this.modalCtrl.create({
              // backdropDismiss: false,
              component: CampusMapFeatureModalComponent,
              componentProps: { feature: geofeature },
              cssClass: 'campus-map-modal',
              showBackdrop: true,
            });
            modal.present();
            await modal.onWillDismiss();
            this.modalOpen = false;
          }
        });

        // add this feature to the corresponding overlay catgory
        overlays[category].addLayer(geoJson);

        // also add geoJSON to list of searchable layers
        this.searchableLayers.addLayer(geoJson);
      }
    }

    // now add all created layers to the map by default
    // TODO: maybe pre-define defaults in config?
    for (const layerName in overlays) {
      if (overlays[layerName]) {
        overlays[layerName].addTo(this.map);
      }
    }

    // add control with overlays to map
    L.control.layers({}, overlays).addTo(map);
    this.addLeafletSearch(this.map);
    map.invalidateSize();
    this.selectCampus(this.currentCampus);
  }
}
