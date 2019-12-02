import {AfterViewInit, Component, ViewChild} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { IMapsResponseObject, ICampus, IMapsResponse } from 'src/app/lib/interfaces';
import { Geolocation, PositionError } from '@ionic-native/geolocation/ngx';
import {ModalController} from '@ionic/angular';
import { CampusMapFeatureModalComponent } from '../../components/campus-map-feature-modal/campus-map-feature-modal.component';
import { CampusTabComponent } from '../../components/campus-tab/campus-tab.component';
import * as L from 'leaflet';
import 'leaflet-easybutton';
import 'leaflet-rotatedmarker';
import 'leaflet-search';
import { AbstractPage } from 'src/app/lib/abstract-page';
import { ConfigService } from '../../services/config/config.service';
import { WebserviceWrapperService } from '../../services/webservice-wrapper/webservice-wrapper.service';
import { AlertService } from 'src/app/services/alert/alert.service';
import { AlertButton } from '@ionic/core';
import {ActivatedRoute} from '@angular/router';
import {LatLngExpression} from 'leaflet';

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
export class CampusMapPage extends AbstractPage implements AfterViewInit {

  campusList: ICampus[] = ConfigService.config.campus;
  currentCampus: ICampus;
  geoJSON: IMapsResponseObject[];
  searchControl;
  searchableLayers: L.LayerGroup = L.layerGroup();
  map: L.Map;

  positionCircle: L.Circle;
  positionMarker: L.Marker;
  latestHeading: number;

  geoLocationWatch;
  geoLocationEnabled = false;
  @ViewChild(CampusTabComponent) campusTab: CampusTabComponent;

  constructor(
    private ws: WebserviceWrapperService,
    private route: ActivatedRoute,
    private translate: TranslateService,
    private location: Geolocation,
    private modalCtrl: ModalController,
    private alertService: AlertService
  ) {
    super({ optionalNetwork: true });
  }

  /**
   * @name loadMap
   * @description loads map and initializes it
   */
  initializeLeafletMap() {
    // create map object
    const map = L.map('map');
    L.tileLayer(
      'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'www.uni-potsdam.de',
        maxZoom: 18
      }).addTo(map);
    return map;
  }

  /**
   * implementation of abstract page function
   * @param params
   */
  handleQueryParams(params: CampusMapQueryParams) {
    this.logger.entry('handleQueryParams', params);
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
   * @name ionViewWillEnter
   * @desc take user to login if there is no session.
   * We are using ionViewDidEnter here because it is run every time the view is
   * entered, other than ionViewDidLoad which will run only once
   */
  ngAfterViewInit () {
    // initialize map
    if (!this.map) {
      this.map = this.initializeLeafletMap();

      // if the currentCampus has been set already, move there
      if (this.currentCampus) {
        this.moveToCampus(this.currentCampus);
      }

      this.loadMapData(this.map);
      this.addLeafletSearch(this.map);
      this.addGeoLocationButton(this.map);
    }
    // trigger pageReadyResolve, need to wait a second until map is really ready
    // TODO: find out why this timeout is necessary and find better solution
    setTimeout(
      () => this.pageReadyResolve(),
      1000
    );
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
      textPlaceholder: this.translate.instant('page.campus-map.placeholder_search'),
      initial: false,
      minLength: 3,
      filterData: (text, records) => { // Filters records based on search input
        let I, icase, regSearch, frecords = {};
        // text = text.replace(/[.*+?^${}()|[\]\\]/g, '');  // Sanitize remove all special characters

        if (text === '') {
          return [];
        }

        let testtext = text;
        let test = '';
        let hilf = '';
        // Matches "Haus <Nr.>"
        hilf = testtext.match(/haus \d{1,2}/i);
        if ((hilf) && (hilf[0] !== '')) {
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
        hilf = testtext.match(/(\d{1,2}\.\d{1,2}\.\d{1,2})|(\d{1,2}\.\d{1,2})/i);
        if ((hilf) && (hilf[0] !== '')) {
          let hilf2 = hilf[0].split('.');
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
        test += '\\?(?=(.|\\n)*' + testtext.trim().split(' ').join(')(?=(.|\\n)*') + ')';
        I = this.searchControl.options.initial ? '^' : '';  // search only initial text
        icase = !this.searchControl.options.casesensitive ? 'i' : undefined;

        regSearch = new RegExp(I + test, icase);

        // TODO use .filter or .map (from _defaultFilterData in /node_modules/leaflet-search/scr/leaflet-search.js))
        for(let key in records) {
          if (regSearch.test('\?' + key)) {
            frecords[key] = records[key];
          }
        }
        return frecords;
      },
      autoType: false, // guess that would just annoy most users,
      buildTip: (text, val) => {
        const tip = L.DomUtil.create('li', '');
        const properties = val.layer.feature.properties;
        if (properties.Name && properties.campus.pretty_name) {
          let content = `<div id="tooltip-title">${properties.Name} (${properties.campus.pretty_name})</div>`;
          if (properties.description) {
            content += `<div id="tooltip-description">${properties.description.replace(/\n/g, '<br>')}</div>`;
          }

          tip.innerHTML = content;
          L.DomUtil.addClass(tip, 'search-tip');
          tip['_text'] = content;
        }

        return tip;
      }
    });
    map.addControl(this.searchControl);
  }

  /**
   * @name addGeoLocationButton
   * @desc adds geolocation button to map
   */
  addGeoLocationButton(map) {
    const toggleGeolocationButton = L.easyButton({
      states: [{
        stateName: 'geolocation-disabled',
        icon: '<ion-icon style="font-size: 1.4em; padding-top: 5px;" name="locate"></ion-icon>',
        title: this.translate.instant('page.campus-map.enable_geolocation'),
        onClick: (control) => {
          const enableCallback = () => {
            this.geoLocationEnabled = true;
            control.state('geolocation-enabled');
          };
          const disableCallback = () => {
            this.geoLocationEnabled = false;
            control.state('geolocation-disabled');
          };
          this.enableGeolocation(enableCallback, disableCallback);
        }
      }, {
        stateName: 'geolocation-enabled',
        icon: '<ion-icon style="font-size: 1.4em; padding-top: 5px;" name="close-circle"></ion-icon>',
        title: this.translate.instant('page.campus-map.disable_geolocation'),
        onClick: (control) => {
          this.disableGeolocation();
          control.state('geolocation-disabled');
        },
      }]
    });
    toggleGeolocationButton.addTo(map);
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

    // if we are currently heading somewhere, use this value, otherwise use
    // the last recent direction
    if ((position && position.coords && position.coords.heading) || this.latestHeading) {
      // save current value
      if (position && position.coords && position.coords.heading) {
        this.latestHeading = position.coords.heading;
      }

      // TODO: don't create this icon again and again
      const icon = L.icon({
        iconUrl: '../assets/icon/navigate.svg',
        iconSize: [42, 42],
        iconAnchor: [21, 21]
      });

      this.positionMarker = L.marker(
      [position.coords.latitude, position.coords.longitude],
      {
        rotationAngle: this.latestHeading,
        icon: icon
      });
      this.positionMarker.addTo(this.map);
    }

    this.positionCircle = L.circle(
      [position.coords.latitude, position.coords.longitude],
      {
        color: 'blue',
        fillColor: '#0000ff',
        fillOpacity: 0.5,
        radius: position.coords.accuracy ? position.coords.accuracy : 10
      }
    );
    this.positionCircle.addTo(this.map);
  }

  /**
   * @name  enableGeolocation
   * @desc enabled retrieval of location and starts function that adds a circle
   * to the map. Returns an observable that constantly returns success when the
   * current position could be fetched and error when there was an error.
   */
  enableGeolocation(enableCallback, disableCallback) {
    this.geoLocationWatch = this.location.watchPosition().subscribe(
      (positionResponse: Position & PositionError) => {
        if (!positionResponse.code) {
          this.setPosition(positionResponse);
          enableCallback();
        } else {
          this.logger.debug('enableGeolocation', `error getting position: ${positionResponse.message ? positionResponse.message : ''}`);
          disableCallback();
        }
      },
      error => {
        this.logger.error('enableGeolocation', error);
        disableCallback();
      }
    );
  }

  /**
   * @name disableGeolocation
   * @desc disables geolocation by unsubscribing from watch and deleting current
   * positionCircle
   */
  disableGeolocation() {
    this.geoLocationEnabled = false;
    if (this.positionCircle) {
      this.map.removeLayer(this.positionCircle);
    }

    if (this.positionMarker) {
      this.map.removeLayer(this.positionMarker);
    }

    this.geoLocationWatch.unsubscribe();
  }

  /**
   * @name loadMapData
   * @description loads campus map data from cache
   */
  loadMapData(map) {
    this.ws.call('maps').subscribe(
      (response: IMapsResponse) => {
        this.geoJSON = response;
        this.addFeaturesToLayerGroups(this.geoJSON, map);
      }, () => {
        const buttons: AlertButton[] = [{
          text: this.translate.instant('button.continue'),
          handler: () => {
            this.navCtrl.navigateRoot('/home');
          }
        }];
        this.alertService.showAlert(
          {
            headerI18nKey: 'alert.title.httpError',
            messageI18nKey: 'alert.network'
          },
          buttons
        );
      }
    );
  }

  /**
   * selects the given campus and sets fitBounds to the campus' bounds
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
   * @description fits map to given campus
   * @param {string | name} query
   */
  queryCampus(query: string | number) {
    if (this.config.campus) {
      return this.config.campus.find(
        (campus: ICampus) => {
          return campus.location_id === query
            || campus.location_id === query.toString()
            || campus.name === query
            || campus.pretty_name === query;
        }
      );
    } else { return undefined; }
  }

  /**
   * Queries the desired campus and moves there if it can be found
   * @param query
   */
  moveToQueriedCampus(query: string | number) {
    const foundCampus = this.queryCampus(query);
    if (foundCampus) {
      this.logger.info(`moving to campus ${foundCampus.pretty_name}`);
      this.selectCampus(foundCampus);
    } else {
      this.logger.error(`could not find campus by query: '${query}'`);
    }
  }

  /**
   * move map to given feature, if it exists
   */
  moveToFeature(feature) {

  }

  /**
   * flys to given coordinates
   * @param coordinates
   */
  moveToPosition(coordinates: LatLngExpression) {
    this.logger.entry('moveToPosition', coordinates);
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
    for (const c of this.campusList) { campusMapping[c.name] = c; }

    // this object will be populated next and then added to the map
    const overlays: {[name: string]: L.LayerGroup} = {};

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
      for (const feature of obj.geo.features) {
        const props = feature.properties;

        // create new property that can easily be searched by leaflet-search
        props['campus'] = campusMapping[obj.campus];
        props['category'] = category;
        props['searchProperty'] = `${props.Name} ${props.description ? props.description : ''} (${props.campus.pretty_name})`;
        props['code'] = ``;

        const geoJson = L.geoJSON(feature);

        // add click listener that will open a Modal displaying some information
        geoJson.on('click', async () => {
          if (props.campus !== this.currentCampus) {
            this.currentCampus = props.campus;
          }

          const modal = await this.modalCtrl.create({
            // backdropDismiss: false,
            component: CampusMapFeatureModalComponent,
            componentProps: { feature: feature },
            cssClass: 'campus-map-modal',
            showBackdrop: true
          });
          modal.present();
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
  }
}
