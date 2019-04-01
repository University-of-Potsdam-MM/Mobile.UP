import {Component, OnInit, ViewChild} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {IConfig, IMapsResponseObject, ICampus, IMapsResponse, ILatLongBounds } from 'src/app/lib/interfaces';
import { SettingsService } from 'src/app/services/settings/settings.service';
import { ConnectionService } from 'src/app/services/connection/connection.service';
import { MapsService } from 'src/app/services/maps/maps.service';
import { ConfigService } from 'src/app/services/config/config.service';
import {Geolocation, PositionError} from '@ionic-native/geolocation/ngx';
import * as L from 'leaflet';
import 'leaflet-easybutton';
import 'leaflet-rotatedmarker';
import 'leaflet-search';
import {ModalController} from '@ionic/angular';
import {CampusMapFeatureModalComponent} from '../../components/campus-map-feature-modal/campus-map-feature-modal.component';
import {CampusTabComponent} from '../../components/campus-tab/campus-tab.component';

@Component({
  selector: 'app-campus-map',
  templateUrl: './campus-map.page.html',
  styleUrls: ['./campus-map.page.scss'],
})
export class CampusMapPage implements OnInit {

  constructor(
    private settings: SettingsService,
    private connection: ConnectionService,
    private wsProvider: MapsService,
    private translate: TranslateService,
    private location: Geolocation,
    private modalCtrl: ModalController
  ) { }

  config: IConfig;
  geoJSON: IMapsResponseObject[];
  selectedCampus: ICampus;
  searchableLayers: L.LayerGroup = L.layerGroup();
  map: L.Map;

  positionCircle: L.Circle;
  positionMarker: L.Marker;
  latestHeading: number;

  geoLocationWatch;
  geoLocationEnabled = false;

  @ViewChild(CampusTabComponent) campusTab: CampusTabComponent;

  /**
   * @name loadMap
   * @description loads map and initializes it
   */
  initializeLeafletMap() {
    // create map object
    const map = L.map('map').fitWorld();
    L.tileLayer(
      'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'www.uni-potsdam.de',
        maxZoom: 18
      }).addTo(map);
    return map;
  }

  ngOnInit() {
    this.config = ConfigService.config;
    this.map = this.initializeLeafletMap();

    this.loadMapData(this.map);
    this.addLeafletSearch(this.map);
    this.addGeoLocationButton(this.map);

    // use default campus
    this.settings.getSettingValue('campus').then(
      (campus: string) => {
        this.changeCampus(campus);
      }
    );
  }

  /**
   * @name ionViewWillEnter
   * @desc take user to login if there is no session.
   * We are using ionViewDidEnter here because it is run every time the view is
   * entered, other than ionViewDidLoad which will run only once
   */
  ionViewWillEnter() {
    this.connection.checkOnline(true, true);
  }

  /**
   * @name addLeafletSearch
   * @desc Adds the leaflet search control to the map. Will only work if
   * this.searchableLayers is already populated with geoJSON objects.
   */
  addLeafletSearch(map) {
    map.addControl(new L.Control['Search']({
      layer: this.searchableLayers,
      propertyName: 'searchProperty',
      collapsed: false,
      textErr: this.translate.instant('page.campus-map.no_results'),
      textCancel: this.translate.instant('page.campus-map.cancel'),
      textPlaceholder: this.translate.instant('page.campus-map.placeholder_search'),
      initial: false,
      minLength: 3,
      autoType: false, // guess that would just annoy most users,
      buildTip: (text, val) => {
        const tip = L.DomUtil.create('li', '');
        const properties = val.layer.feature.properties;
        let content = `<div id="tooltip-title">${properties.Name} (${properties.campus})</div>`;
        if (properties.description) {
          content += `<div id="tooltip-description">${properties.description.replace(/\n/g, '<br>')}</div>`;
        }
        tip.innerHTML = content;
        L.DomUtil.addClass(tip, 'search-tip');
        tip['_text'] = content;
        return tip;
      }
    }));
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
          console.log(`[CampusMap]: Error getting position: ${positionResponse.message}`);
          disableCallback();
        }
      },
      error => {
        console.log('[CampusMap]: Error:', error);
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
   * @name changeCampus
   * @description changes the current campus by name
   * @param campus
   */
  changeCampus(campus: string) {
    this.selectCampus(this.getSelectedCampusObject(campus));
  }

  /**
   * @name loadMapData
   * @description loads campus map data
   */
  loadMapData(map) {
    this.wsProvider.getMapData().subscribe(
      (response: IMapsResponse) => {
        this.geoJSON = response;
        this.addFeaturesToLayerGroups(this.geoJSON, map);
      },
      error => {
        console.log(error);
      }
    );
  }

  /**
   * @name getSelectedCampusObject
   * @description returns the correct campus object by name
   * @param campusName
   */
  getSelectedCampusObject(campusName: string) {
    return this.config.campusmap.campi.filter(
      (campus: ICampus) => {
        // special logic to map NeuesPalais == Neues Palais and so on
        return campusName === campus.pretty_name.replace(/\s+/g, '');
      }
    )[0];
  }

  /**
   * @name selectCampus
   * @description selects the given campus and sets fitBounds to the campus' bounds
   * @param {ICampus} campus
   */
  selectCampus(campus: ICampus) {
    this.selectedCampus = campus;
    this.map.fitBounds(this.selectedCampus.lat_long_bounds);
  }

  /**
   * @name addFeaturesToLayerGroups
   * @description adds features of geoJSON to layerControl and adds those layerGroups
   * to the map by default
   */
  async addFeaturesToLayerGroups(geoJSON: IMapsResponse, map: L.Map) {
    // just used to remember which categories we've seen already
    const categories: string[] = [];

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
        props['campus'] = this.translate.instant(`page.campus-map.campus.${obj.campus}`);
        props['category'] = category;
        props['searchProperty'] = `${props.Name} (${props.campus})`;

        const geoJson = L.geoJSON(feature);

        // add click listener that will open a Modal displaying some information
        geoJson.on('click', async () => {

          // TODO: change campus if clicked feature is on other campus

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
