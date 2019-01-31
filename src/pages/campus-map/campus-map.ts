import { Component, ElementRef, ViewChild } from '@angular/core';
import { IonicPage } from 'ionic-angular';
import { ICampus, IConfig, IMapsResponse, IMapsResponseObject } from "../../library/interfaces";
import { ConfigProvider } from "../../providers/config/config";
import * as leaflet from 'leaflet';
import { SettingsProvider } from "../../providers/settings/settings";
import { ConnectionProvider } from "../../providers/connection/connection";
import { WebServiceProvider } from "../../providers/web-service/web-service";
import {TranslateService} from "@ngx-translate/core";


@IonicPage()
@Component({
  selector: 'page-campus-map',
  templateUrl: 'campus-map.html',
})
export class CampusMapPage {

  private query:string;

  config:IConfig = ConfigProvider.config;
  geoJSON:IMapsResponseObject[];
  selectedCampus:ICampus;
  layerGroups:{[name:string]:leaflet.LayerGroup} = {};
  campus;

  @ViewChild('map') mapContainer: ElementRef;
  map: L.Map;

  constructor(
    private settings:SettingsProvider,
    private connection: ConnectionProvider,
    private wsProvider: WebServiceProvider,
    private translate: TranslateService) {
  }

  /**
   * @name ionViewWillEnter
   * @async
   * @description take user to login if there is no session.
   * We are using ionViewDidEnter here because it is run every time the view is
   * entered, other than ionViewDidLoad which will run only once
   */
  async ionViewWillEnter() {
    this.connection.checkOnline(true, true);
    // initialize map
    this.loadMap();
  }


  public async changeCampus(campus) {

    this.campus = campus;
    console.log(this.campus)
    this.loadCampusMap();
  }

  /**
   * @async
   * @description load campus map
   */
  async loadCampusMap() {

    // select default campus first as specified in config in config
    this.selectCampus(this.getDefaultCampus());

    // fit bounds to show selected campus
    this.moveToCampus(this.selectedCampus);

    this.wsProvider.getMapData().subscribe(
      (response:IMapsResponse) => {
        this.geoJSON = response;
        this.addFeaturesToLayerGroups(this.geoJSON);
      },
      error => {
        console.log(error)
      }
    )

  }


  /**
   * @name loadMap
   * @description loads map and initializes it
   */
  loadMap(){
    // create map object
    this.map = leaflet.map("map");
    leaflet.tileLayer(
      'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'www.uni-potsdam.de',
        maxZoom: 18
      }).addTo(this.map);
  }


  /**
   * @name getDefaultCampus
   * @description Returns the default campus object based on the information
   * provided in config.general.location
   * @return {ICampus} default campus object
   */
  getDefaultCampus():ICampus{
    return this.config.campusmap.campi.filter(
      (campus:ICampus) => {
        // special logic to map NeuesPalais == Neues Palais and so on
        return this.campus == campus.pretty_name.replace(/\s+/g, '');
      }
    )[0]
  }


  /**
   * @name selectCampus
   * @description selects the given campus
   * @param {ICampus} campus
   */
  selectCampus(campus:ICampus){
    this.selectedCampus = campus;
    if(this.map){
      this.moveToCampus(this.selectedCampus)
    }
  }


  /**
   * @name moveToCampus
   * @description fits map to given campus
   * @param {ICampus} campus
   */
  moveToCampus(campus:ICampus){
    this.map.fitBounds(
      campus.lat_long_bounds
    );
  }


  /**
   * @name addFeaturesToLayerGroups
   * @description adds features of geoJSON to layerGroups and adds those layerGroups
   * to the maps object
   */
  addFeaturesToLayerGroups(geoJSON){
    // just used to remember which categories we've seen already
    let categories:string[] = [];

    for(let obj of geoJSON){
      // create correct title string beforehand so we don't have to do it twice
      let title = this.translate.instant(
        "page.campusMap.category."+obj.category
      );

      // check if we already have this category in layerGroups
      if(categories.indexOf(obj.category) == -1){
        // Create new layer for each unique category
        this.layerGroups[title] = leaflet.layerGroup();
        // just push category name so we know we already got that one
        categories.push(obj.category);
      }

      // add features from each category to corresponding layer
      for(let feature of obj.geo.features){
        // TODO:
        //  - include information about feature?
        //  - maybe make this prettier or even include link to OpeningHoursPage
        //  with correct segment?

        let popupTemplate = feature.properties.Name;
        this.layerGroups[title].addLayer(
          leaflet.geoJSON(feature).bindPopup(
            popupTemplate
          )
        );
      }
    }

    // now add layerGroups to the map so the user can use them
    leaflet.control.layers({}, this.layerGroups).addTo(this.map);
  }


  /**
   * @name search
   * @description triggers a search over the stored geoJson data
   * @param {string} queryString
   */
  search(queryString){
    console.log(queryString);
    this.query = queryString;

    // //clear map from displayed layers
    // var map = this.map;
    //
    // for(var layer in this.layers){
    //   map.removeLayer(this.layers[layer]);
    // }
    //
    // this.geoJSON.forEach(
    //   (obj:IMapsResponseObject) => {
    //     var that = this;
    //     leaflet.geoJSON(obj.geo, {filter: function(feature){
    //       if (feature.properties.Name && feature.properties.Name.toString().indexOf(that.query) !== -1) {
    //         return true
    //       }
    //     }}).addTo(this.map);
    //   }
    // );
  }
}
