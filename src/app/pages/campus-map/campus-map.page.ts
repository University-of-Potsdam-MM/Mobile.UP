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
import 'leaflet-search';

@Component({
  selector: 'app-campus-map',
  templateUrl: './campus-map.page.html',
  styleUrls: ['./campus-map.page.scss'],
})
export class CampusMapPage implements OnInit {

  config: IConfig;
  geoJSON: IMapsResponseObject[];
  selectedCampus: ICampus;
  layerGroups: {[name: string]: L.LayerGroup} = {};
  searchableLayers: L.LayerGroup = L.layerGroup();

  @ViewChild('map') mapContainer: ElementRef;
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
   * @name ionViewWillEnter
   * @async
   * @description take user to login if there is no session.
   * We are using ionViewDidEnter here because it is run every time the view is
   * entered, other than ionViewDidLoad which will run only once
   */
  ionViewWillEnter() {
    this.connection.checkOnline(true, true);

    // initialize map
    if (!this.map) { this.map = this.initializeLeafletMap(); }

    this.addGeoLocationButton();
    this.loadMapData();
    this.addLeafletSearch();

    // after map is initialized use default campus
    this.settings.getSettingValue('campus').then(
      (campus: string) => {
        this.changeCampus(campus);
      }
    );
  }

  /**
   * @name addLeafletSearch
   * @desc Adds the leaflet search control to the map. Will only work if
   * this.searchableLayers is already populated with geoJSON objects.
   */
  addLeafletSearch() {
    this.map.addControl(new L.Control['Search']({
      layer: this.searchableLayers,
      propertyName: 'searchProperty',
      collapsed: false,
      textErr: this.translate.instant('page.campus-map.no_results'),
      textCancel: this.translate.instant('page.campus-map.cancel'),
      textPlaceholder: this.translate.instant('page.campus-map.placeholder_search'),
      initial: false,
      minLength: 3,
      autoType: false // guess that would just annoy most users,
      // buildTip: function(text: string, val) {
      //   console.log(text, val);
      //   return '<a href="#">'+text+'<em style="background:'+text+'; width:14px;height:14px;float:right"></em></a>';
      // }
    }));
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
   * @description selects the given campus
   * @param {ICampus} campus
   */
  selectCampus(campus: ICampus) {
    this.selectedCampus = campus;
    if (this.map) {
      this.moveToCampus(this.selectedCampus);
    }
  }

  /**
   * @name moveToCampus
   * @description fits map to given campus
   * @param {ICampus} campus
   */
  moveToCampus(campus: ICampus) {
    this.map.fitBounds(
      campus.lat_long_bounds
    );
  }

  /**
   * @name addFeaturesToLayerGroups
   * @description adds features of geoJSON to layerGroups and adds those layerGroups
   * to the maps object
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
        this.layerGroups[title] = L.layerGroup();
        // just push category name so we know we already got that one
        categories.push(obj.category);
      }

      // add features from each category to corresponding layer
      for (const feature of obj.geo.features) {
        // TODO:
        //  - maybe make this prettier or even include link to OpeningHoursPage
        //  with correct segment?

        const props = feature.properties;

        // create new property that can easily be searched by leaflet-search
        props['searchProperty'] = `${props.Name} ${props.description ? props.description : ''}`;

        const popupTemplate = `<h1>${props.Name}</h1><div>${props.description ? props.description : ''}</div>`;

        const geoJson = L.geoJSON(feature).bindPopup(popupTemplate);

        this.layerGroups[title].addLayer(
          geoJson
        );

        // also add geoJSON to list of searchable layers
        this.searchableLayers.addLayer(geoJson);
      }
    }

    // select all layers by default
    for (const layerName in this.layerGroups) {
      if (layerName) {
        this.layerGroups[layerName].addTo(this.map);
      }
    }

    // now add layerGroups to the map so the user can select/deselect them
    L.control.layers({}, this.layerGroups).addTo(this.map);
  }

}
