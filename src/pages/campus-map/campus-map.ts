import { Component, ElementRef, ViewChild } from '@angular/core';
import { IonicPage } from 'ionic-angular';
import { ICampus, IConfig } from "../../library/interfaces";
import { ConfigProvider } from "../../providers/config/config";
import * as leaflet from 'leaflet';
import { IMapsResponse, IMapsResponseObject } from "../../library/IGeoJson";
import { SettingsProvider } from "../../providers/settings/settings";
import { ConnectionProvider } from "../../providers/connection/connection";
import { WebServiceProvider } from "../../providers/web-service/web-service";

@IonicPage()
@Component({
  selector: 'page-campus-map',
  templateUrl: 'campus-map.html',
})
export class CampusMapPage {

  query:string;

  config:IConfig = ConfigProvider.config;
  geoJSON:IMapsResponseObject[];
  selectedCampus:ICampus;
  categories:string[] = [];
  layers:{[name:string]:leaflet.GeoJSON} = {};
  campus;

  @ViewChild('map') mapContainer: ElementRef;
  map: any;

  constructor(
    private settings:SettingsProvider,
    private connection: ConnectionProvider,
    private wsProvider: WebServiceProvider) {
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

    // set up scheduled geoJson retrieval
    this.wsProvider.getMapData().subscribe(
      (response:IMapsResponse) => {
        this.geoJSON = response;
        this.addFeatures()
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
   * @name addFeatures
   * @description collects categories from geoJson and returns array of unique
   * categories
   */
  addFeatures(){
    console.log(this.geoJSON);
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
      // TODO
      // this.layers[category].getElement().style.display = "none"
    }
  }











}