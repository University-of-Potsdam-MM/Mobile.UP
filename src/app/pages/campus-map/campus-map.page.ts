import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { IConfig, IMapsResponseObject, ICampus, IMapsResponse } from 'src/app/lib/interfaces';
import { SettingsService } from 'src/app/services/settings/settings.service';
import { ConnectionService } from 'src/app/services/connection/connection.service';
import { MapsService } from 'src/app/services/maps/maps.service';
import { ConfigService } from 'src/app/services/config/config.service';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import * as L from 'leaflet';
import 'leaflet-easybutton';
import 'leaflet-rotatedmarker';

@Component({
  selector: 'app-campus-map',
  templateUrl: './campus-map.page.html',
  styleUrls: ['./campus-map.page.scss'],
})
export class CampusMapPage implements OnInit {

  /** ngx-leaflet inputs */

  options = {
    layers: [
      L.tileLayer(
      'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { maxZoom: 18, attribution: 'www.uni-potsdam.de'}
      )
    ],
    zoom: 5
  };

  layers = [];

  layersControl = {overlays: {}};

  // default fitBounds is none
  fitBounds = null;

  /** regular attributes */

  config: IConfig;
  geoJSON: IMapsResponseObject[];
  selectedCampus: ICampus;

  map: L.Map;

  positionCircle: L.Circle;
  positionMarker: L.Marker;
  latestHeading: number;

  geoLocationWatch;
  geoLocationEnabled = false;

  constructor(
    private settings: SettingsService,
    private connection: ConnectionService,
    private wsProvider: MapsService,
    private translate: TranslateService,
    private location: Geolocation
  ) { }

  ngOnInit() {
    this.config = ConfigService.config;
  }

  /**
   * @name onMapReady
   * @desc triggered when map is usable. Used for adding elements to the map
   * @param map
   */
  onMapReady(map) {
    this.map = map;
    this.addGeoLocationButton();

    // load geoJson data
    this.loadMapData();

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
   * @name addGeoLocationButton
   * @desc adds geolocation button to this.map
   */
  addGeoLocationButton() {
    const toggleGeolocationButton = L.easyButton({
      states: [{
        stateName: 'geolocation-disabled',
        icon: '<ion-icon style="font-size: 1.4em; padding-top: 5px;" name="locate"></ion-icon>',
        title: this.translate.instant('page.campus-map.enable_geolocation'),
        onClick: (control) => {
          this.enableGeolocation();
          control.state('geolocation-enabled');
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
    toggleGeolocationButton.addTo(this.map);
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
   * to the map
   */
  enableGeolocation() {
    this.geoLocationEnabled = true;
    this.geoLocationWatch = this.location.watchPosition().subscribe(
      (position: Position) => {
        if (!position) {
          console.log('[CampusMap]: Error getting location');
        } else {
          this.setPosition(position);
        }
      },
      error => {
        console.log('[CampusMap]: Error:', error);
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
  loadMapData() {

    this.wsProvider.getMapData().subscribe(
      (response: IMapsResponse) => {
        this.geoJSON = response;
        this.addFeaturesToLayerGroups(this.geoJSON);
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
    this.fitBounds = this.selectedCampus.lat_long_bounds;
  }

  /**
   * @name addFeaturesToLayerGroups
   * @description adds features of geoJSON to layerControl and adds those layerGroups
   * to the map by default
   */
  addFeaturesToLayerGroups(geoJSON) {
    // just used to remember which categories we've seen already
    const categories: string[] = [];

    for (const obj of geoJSON) {
      // create correct title string beforehand so we don't have to do it twice
      const title = this.translate.instant(
        'page.campus-map.category.' + obj.category
      );

      // check if we already have this category in layerGroups
      if (categories.indexOf(obj.category) === -1) {
        // Create new layer for each unique category
        this.layersControl.overlays[title] = L.layerGroup();
        // just push category name so we know we already got that one
        categories.push(obj.category);
      }

      // add features from each category to corresponding layer
      for (const feature of obj.geo.features) {
        // TODO:
        //  - maybe make this prettier or even include link to OpeningHoursPage
        //  with correct segment?

        const props = feature.properties;

        const popupTemplate = `<h1>${props.Name}</h1><div>${props.description ? props.description : ''}</div>`;

        this.layersControl.overlays[title].addLayer(L.geoJSON(feature).bindPopup(popupTemplate));
      }
    }

    // now add all created layers to the map by default
    // TODO: maybe pre-define defaults in config?
    // if(layerName in this.config.campusmap.defaultlayers) { ... }
    for (const layerName in this.layersControl.overlays) {
      this.layers.push(this.layersControl.overlays[layerName]);
    }

  }

}
