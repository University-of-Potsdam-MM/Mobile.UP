import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { IConfig } from '../../library/interfaces';
import { Storage } from '@ionic/storage';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import * as xml2js from 'xml2js';

@IonicPage()
@Component({
  selector: 'page-library',
  templateUrl: 'library.html',
})
export class LibraryPage {

  query = "";
  config:IConfig;
  startRecord = "1"; // hochsetzen beim nachladen von ergebnissen
  maximumRecords = "10"; // wie viele geladen werden

  isLoading = false;
  isLoaded = false;
  bookList = [];
  numberOfRecords = "0";

  constructor(public navCtrl: NavController, public navParams: NavParams, private storage: Storage, private http: HttpClient) {
  }

  async ngOnInit() {
    this.config = await this.storage.get("config");
  }

  searchLibrary(resetList:boolean, infiniteScroll?) {
    console.log(this.query);

    if (this.query.trim() != "") {

      if (resetList) {
        this.bookList = [];
        this.startRecord = "1"; 
        this.numberOfRecords = "0";
        this.isLoading = true;
        this.isLoaded = false;
      }
  
      let url = this.config.webservices.endpoint.library;
  
      let headers = new HttpHeaders()
        .append("Authorization", this.config.webservices.apiToken);
  
      let params = new HttpParams()
        .append("operation", "searchRetrieve")
        .append("query", this.query.trim())
        .append("startRecord", this.startRecord)
        .append("maximumRecords", this.maximumRecords)
        .append("recordSchema", "mods");
  
      this.http.get(url, {headers:headers, params:params, responseType: "text"}).subscribe(res => {
        this.parseXMLtoJSON(res).then(data => {
  
          var tmp, tmpList;
          if (data["zs:searchRetrieveResponse"]) {
            tmp = data["zs:searchRetrieveResponse"];
          }

          if (tmp["zs:records"]) {
            tmpList = tmp["zs:records"]["zs:record"];
          }

          if (tmp["zs:numberOfRecords"]) {
            this.numberOfRecords = tmp["zs:numberOfRecords"];
          }
  
          var i;
          if (Array.isArray(tmpList)) {
            for (i = 0; i < tmpList.length; i++) {
              this.bookList.push(tmpList[i]["zs:recordData"]["mods"]);
            }
          }
  
          console.log(this.numberOfRecords);
          console.log(this.bookList);
  
          this.isLoading = false;
          this.isLoaded = true;
          if (infiniteScroll) { infiniteScroll.complete(); }
        });
      }, error => {
        console.log(error);
        this.isLoading = false;
        this.isLoaded = true;
        if (infiniteScroll) { infiniteScroll.complete(); }
      });
    }
  }

  parseXMLtoJSON(data) {
    var parser = new xml2js.Parser({ trim:true, explicitArray:false });

    return new Promise(resolve => {
      parser.parseString(data, function(err, result) {
        resolve(result);
      });
    })
  }

  resultIndex() {
    if (Number(this.numberOfRecords) < (Number(this.startRecord) + 9)) {
      return this.numberOfRecords;
    } else {
      let s = "1 - " + (Number(this.startRecord) + 9)
      return s;
    }
  }

  loadMore(infiniteScroll) {
    this.startRecord = String(Number(this.startRecord) + 10);
    console.log(this.startRecord);
    console.log(this.numberOfRecords);
    if (Number(this.startRecord) <= Number(this.numberOfRecords)) {
      this.searchLibrary(false, infiniteScroll);
    } else { infiniteScroll.complete(); }
  }

  convertToArray(toConvert) { // convert everything to an array so you can handle it universally 
    if (this.isArray(toConvert)) {
      return toConvert;
    } else {
      var tmp = [];
      tmp.push(toConvert);
      return tmp;
    }
  }

  isArray(toCheck) {
    if (Array.isArray(toCheck)) {
      return true;
    } else { return false; }
  }

  isEnd() {
    if (Number(this.startRecord) <= Number(this.numberOfRecords)) {
      return false;
    } else { return true; }
  }

  checkMediaType(typeOfResource, originInfo, physicalDescription) {
    var isRemote = false;
    if (physicalDescription) {
      var i; 
      var physicalDescriptionArr = this.convertToArray(physicalDescription.form);
      for (i = 0; i < physicalDescriptionArr.length; i++) {
        if (physicalDescriptionArr[i]._ == "remote") {
          isRemote = true;
        }
        if (physicalDescriptionArr[i]._ == "microform") {
          return "help"; // E = ???
        }
      }
    }

    if (typeOfResource._) { typeOfResource = typeOfResource._ }
    let soundRec:boolean = typeOfResource.includes("sound recording");
    if (typeOfResource) {
      switch(typeOfResource) {
        case "manuscript": {
          return "help"; // H = ???
        }
        case "still image": {
          return "ios-image-outline"; // I = Image
        }
        case "cartographic": {
          return "ios-map-outline"; // K = Kartografie
        }
        case "notated music": {
          return "ios-musical-notes-outline"; // M = Music
        }
        case "moving image": {
          return "ios-videocam-outline"; // V = Video
        }
        case "text": {
          if (originInfo && (originInfo.issuance == "serial" || originInfo.issuance == "continuing")) {
            return "ios-document-outline"; // T = Text
          } else {
            return "md-bookmarks"; // B = Book
          }
        }
        case "software, multimedia": {
          if (originInfo && (originInfo.issuance == "serial" || originInfo.issuance == "continuing")) {
            if (isRemote) {
              return "ios-paper-outline"; // P = Paper
            } else {
              return "ios-document-outline"; // T = Text
            }
          } else if (isRemote) {
            return "cloud-outline"; // O = Online
          } else {
            return "ios-disc-outline"; // S = Software
          }
        }
        default: {
          if (soundRec) {
            return "volume-up"; // G = Recordings
          } else {
            return "help"; // X = undefined
          }
        }
      }
    }

  }

}
