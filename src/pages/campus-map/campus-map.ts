import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';
import { IonicPage } from 'ionic-angular';
import {ICampus, IConfig} from "../../library/interfaces";
import {ConfigProvider} from "../../providers/config/config";
import * as leaflet from 'leaflet';
import {IMapsResponse, IMapsResponseObject} from "../../library/IGeoJson";
import {SettingsProvider} from "../../providers/settings/settings";
import {WebServiceProvider} from "../../providers/web-service/web-service";

@IonicPage()
@Component({
  selector: 'page-campus-map',
  templateUrl: 'campus-map.html',
})
export class CampusMapComponent implements AfterViewInit{

  query:string;

  config:IConfig = ConfigProvider.config;
  geoJSON:IMapsResponseObject[];
  selectedCampus:ICampus;
  categories:string[] = [];
  layers:{[name:string]:leaflet.GeoJSON} = {};

  @ViewChild('map') mapContainer: ElementRef;
  map: any;

  constructor(private settings:SettingsProvider,
              private wsProvider: WebServiceProvider) {
  }

  /**
   * @name search
   * @description triggers a search over the stored geoJson data
   * @param {string} queryString
   */
  search(queryString){
    console.log(queryString)
  }

  /**
   * @name selectCategory
   * @description selects categories to be shown
   * @param c
   */
  selectCategory(c){
    for(let category of c){
      // this.layers[category].getElement().style.display = "none"
    }
  }

  /**
   * @name getGeoJson
   * @description Retrieves map data from server
   */
  loadGeoJson(){
    this.wsProvider.getMapData().subscribe(
      (response:IMapsResponse) => {
        this.geoJSON = response;
      },
      error => {
        console.log(error)
      }
    )
  }

  /**
   * @name addFeatures
   * @description collects categories from geoJson and returns array of unique
   * categories
   */
  addFeatures(){
    this.geoJSON.forEach(
      (obj:IMapsResponseObject) => {
        // Create new layer for each new category
        if(this.categories.indexOf(obj.category) == -1){
          this.categories.push(obj.category);
          this.layers[obj.category] = leaflet.geoJSON().addTo(this.map)
        }
        // add features from each category to corresponding layer
        for(let feature of obj.geo.features){
          this.layers[obj.category].addData(<any>feature)
        }
      }
    );
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
        this.settings.getSettingValue("campus");
        // return campus.id == this.config.general.location.campus
      }
    )[0]
  }

  /**
   * @name selectCampus
   * @description selects the given campus
   * @param {ICampus} campus to select
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
   * @param coordinates
   */
  moveToCampus(campus:ICampus){
    this.map.fitBounds(
      campus.lat_long_bounds
    );
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
   * @name ngAfterViewInit
   * @description triggers methods for initializing this component
   */
  ngAfterViewInit (){
    // initialize map
    this.loadMap();

    // select default campus first as specified in config in config
    this.selectCampus(this.getDefaultCampus());

    // fit bounds to show selected campus
    this.moveToCampus(this.selectedCampus);

    // set up scheduled geoJson retrieval
    this.loadGeoJson();

    // reads categories from geoJson and adds features of each category
    this.addFeatures()
  }

}
