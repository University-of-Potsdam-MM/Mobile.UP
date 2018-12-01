import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Platform } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { IConfig } from '../../library/interfaces';
import { HttpClient } from '@angular/common/http';
import * as moment from 'moment';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { SafariViewController } from '@ionic-native/safari-view-controller';
import { CacheService } from 'ionic-cache';

@IonicPage()
@Component({
  selector: 'page-book-detail-view',
  templateUrl: 'book-detail-view.html',
})
export class BookDetailViewPage {

  activeSegment = "location";
  config:IConfig;
  showLocation = true;
  showDetails = false;
  showShortAbstract = true;
  showFullTOC = false;

  book;
  bookLocationList;
  shortAbstract = false;
  bookDetails = {
    "url": null,
    "keywords": [],
    "isbn": [],
    "series": [],
    "extent": [],
    "notes": [],
    "toc": [],
    "abstract": "",
    "shortAbstract": null,
    "mediaType": null,
    "noDetails": true
  };

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    private storage: Storage,
    private http: HttpClient,
    private theInAppBrowser: InAppBrowser,
    private platform: Platform,
    private cache: CacheService,
    private safari: SafariViewController) {
    this.book = this.navParams.data["book"];
    console.log(this.book);
  }

  async ngOnInit() {
    this.config = await this.storage.get("config");
    this.updateLocation();
    this.updateDetails();
  }

  convertToArray(toConvert) { // convert everything to an array so you can handle it universally 
    if (Array.isArray(toConvert)) {
      return toConvert;
    } else {
      var tmp = [];
      tmp.push(toConvert);
      return tmp;
    }
  }

  isInArray(array, value) { // checks if value is in array
    var i;
    var found = false;
    for (i = 0; i < array.length; i++) {
      if (array[i] == value) {
        found = true;
      }
    }
    return found;
  }

  updateDetails() {
    this.getKeywords();
    this.getISBN();
    this.getSeries();
    this.getExtent();
    this.getNotes();
    this.getAbstractAndTOC();
  }

  updateLocation(refresher?) {
    if (refresher) {
      this.cache.removeItem("bookLocation"+this.book.recordInfo.recordIdentifier._);
    }

    let url = this.config.webservices.endpoint.libraryDAIA + this.book.recordInfo.recordIdentifier._ + "&format=json";
    let request = this.http.get(url);
    this.cache.loadFromObservable("bookLocation"+this.book.recordInfo.recordIdentifier._, request).subscribe(data => {
      if (refresher) {
        refresher.complete();
      }
      this.setLocationData(data);
    }, error => {
      console.log(error);
      if (refresher) {
        refresher.complete();
      }
    });
  }

  setLocationData(data) {
    // console.log(data);
    this.bookLocationList = [];
    if (data) {
      var i, j;
      for (i = 0; i < data.document.length; i++) {
        for (j = 0; j < data.document[i].item.length; j ++) {
          var locationModel = {
            department:     this.getDepartment(data.document[i].item[j]),
            departmentURL:  this.getDepartmentURL(data.document[i].item[j]),
            label:          this.getLabel(data.document[i].item[j]),
            item:           this.getItem(data.document[i].item[j]),
            url:            this.getBookUrl(data.document[i].item[j])
          }
          this.bookLocationList.push(locationModel);
        }
      }
    }
    // console.log(this.bookLocationList);
  }

  getDepartment(item) {
    var department = "";
    if (item.department && item.department.content) {
      department = item.department.content;
    }
    if (item.storage) {
      department = department + ", " + item.storage.content;
    }
    return department;
  }

  getDepartmentURL(item) {
    if (item.department && item.department.id) {
      return item.department.id;
    } else { return ""; }
  }

  getLabel(item) {
    if (item.label) {
      return item.label
    } else { return ""; }
  }

  getBookUrl(item) {
    if (this.book.location) {
      var i; 
      let tmp = this.convertToArray(this.book.location);
      for (i = 0; i < tmp.length; i++) {
        if (tmp[i].url) {
          var tmpUrl = this.convertToArray(tmp[i].url);
          var j;
          for (j = 0; j < tmpUrl.length; j++) {
            if (tmpUrl[j].$ && (tmpUrl[j].$.usage == 'primary display')) {
              if (tmpUrl[j]._) {
                this.bookDetails.url = tmpUrl[j]._;
              }
            }
          }
        }
      }
    }

    if (this.bookDetails.mediaType == "mediatype_o") {
      var url;
      if (item.unavailable && item.unavailable[0].service == "openaccess") {
        url = item.unavailable[0].href;
      } else { url = null; }
      if (url != null) { this.bookDetails.url = url; }
    }

    return this.bookDetails.url;
  }

  getItem(item) {
    var status = "", statusInfo = "";

    // check for available / unavailable items and process loan and presentation
    if (item.available) {
      var loanAvailable, presentationAvailable;
      let availableArray = this.convertToArray(item.available);
      var i;
      for (i = 0; i < availableArray.length; i++) {
        if (availableArray[i] && availableArray[i].service == "loan") {
          loanAvailable = availableArray[i];
        }
        if (availableArray[i] && availableArray[i].service == "presentation") {
          presentationAvailable = availableArray[i];
        }
      }
    }

    if (item.unavailable) {
      var loanUnavailable, presentationUnavailable;
      let unavailableArray = this.convertToArray(item.available);
      var j;
      for (j = 0; j < unavailableArray.length; j++) {
        if (unavailableArray[j] && unavailableArray[j].service == "loan") {
          loanUnavailable = unavailableArray[j];
        }
        if (unavailableArray[j] && unavailableArray[j].service == "presentation") {
          presentationUnavailable = unavailableArray[j];
        }
      }
    }

    if (loanAvailable) {
      status = "ausleihbar";

      if (presentationAvailable && presentationAvailable.href) {
        statusInfo = presentationAvailable.href;
      }

      if (loanAvailable.href == "") {
        statusInfo = statusInfo + "Bitte bestellen";
      }
    } else {
      if (loanUnavailable && loanUnavailable.href) {
        if (loanUnavailable.href.indexOf("loan/RES") != -1) {
          status = "ausleihbar";
        } else { status = "nicht ausleihbar"; }
      } else {
        if (this.getBookUrl(item) == null) {
          if (item.label && item.label.indexOf("bestellt") != -1) {
            status = item.label;
            statusInfo = "";
          } else {
            status = "Präsenzbestand";
            if (presentationAvailable && presentationAvailable.href) {
              statusInfo = presentationAvailable.href;
            }
          }
        } else {
          status = "Online-Ressource im Browser öffnen";
        }
      }

      if (presentationUnavailable) {
        if (loanUnavailable && loanUnavailable.href) {
          if (loanUnavailable.href.indexOf("loan/RES") != -1) {
            status = "ausgeliehen";
            if(!loanUnavailable.expected || loanUnavailable.expected == "unknown") {
              statusInfo = statusInfo + "ausgeliehen, Vormerken möglich";
            } else {
              statusInfo = statusInfo + "ausgeliehen bis ";
              statusInfo = statusInfo + moment(loanUnavailable.expected, "YYYY-MM-DD").format("DD.MM.YYYY");
              statusInfo = statusInfo + ", Vormerken möglich";
            }
          }
        } else {
          statusInfo = statusInfo + "...";
        }
      }
    }

    return [status, statusInfo];
  }

  getKeywords() {
    if (this.book.subject) {
      let tmp = this.convertToArray(this.book.subject);
      var i;
      for (i = 0; i < tmp.length; i++) {
        if (tmp[i] && tmp[i].topic) {
          if (!this.isInArray(this.bookDetails.keywords, tmp[i].topic)) {
            this.bookDetails.keywords.push(tmp[i].topic);
            this.bookDetails.noDetails = false;
          }
        } else if (tmp[i] && tmp[i].geographic) {
          if (!this.isInArray(this.bookDetails.keywords, tmp[i].geographic)) {
            this.bookDetails.keywords.push(tmp[i].geographic);
            this.bookDetails.noDetails = false;
          }
        } else if (tmp[i] && tmp[i].$ && tmp[i].$.displayLabel) {
          if (!this.isInArray(this.bookDetails.keywords, tmp[i].$.displayLabel)) {
            this.bookDetails.keywords.push(tmp[i].$.displayLabel);
            this.bookDetails.noDetails = false;
          }
        }
      }
    }
  }

  getISBN() {
    if (this.book.identifier) {
      let tmp = this.convertToArray(this.book.identifier);
      var i;
      for (i = 0; i < tmp.length; i++) {
        if (tmp[i] && tmp[i].$ && tmp[i].$.type == "isbn" && tmp[i]._) {
          if(!this.isInArray(this.bookDetails.isbn, tmp[i]._)) {
            this.bookDetails.isbn.push(tmp[i]._);
            this.bookDetails.noDetails = false;
          }
        }
      }
    }
  }

  getSeries() {
    var i;
    if (this.book.titleInfo) {
      let tmp = this.convertToArray(this.book.titleInfo);

      for (i = 0; i < tmp.length; i++) {
        if (tmp[i] && tmp[i].partNumber && !this.isInArray(this.bookDetails.series, tmp[i].partNumber)) {
          this.bookDetails.series.push(tmp[i].partNumber);
          this.bookDetails.noDetails = false;
        }
      }
    }
    if (this.book.relatedItem) {
      let tmp = this.convertToArray(this.book.relatedItem);

      for (i = 0; i < tmp.length; i++) {
        if (tmp[i] && tmp[i].$ && tmp[i].$.type == "series") {
          if (tmp[i].titleInfo && tmp[i].titleInfo.title && !this.isInArray(this.bookDetails.series, tmp[i].titleInfo.title)) {
            this.bookDetails.series.push(tmp[i].titleInfo.title);
            this.bookDetails.noDetails = false;
          }
        }
      }
    }
  }

  getExtent() {
    var i;
    if (this.book.physicalDescription) {
      let tmp = this.convertToArray(this.book.physicalDescription);

      for (i = 0; i < tmp.length; i++) {
        if (tmp[i] && tmp[i].extent && !this.isInArray(this.bookDetails.extent, tmp[i].extent)) {
          this.bookDetails.extent.push(tmp[i].extent);
          this.bookDetails.noDetails = false;
        }
      }
    }
  }

  getNotes() {
    var i;
    if (this.book.note) {
      let tmp = this.convertToArray(this.book.note);

      for (i = 0; i < tmp.length; i++) {
        if (tmp[i] && tmp[i]._ && !this.isInArray(this.bookDetails.notes, tmp[i]._)) {
          this.bookDetails.notes.push(tmp[i]._);
          this.bookDetails.noDetails = false;
        } else if (typeof tmp[i] === "string" && !this.isInArray(this.bookDetails.notes, tmp[i])) {
          this.bookDetails.notes.push(tmp[i]);
          this.bookDetails.noDetails = false;
        } 
      }
    }

    if (this.book.relatedItem && this.book.relatedItem.note) {
      let tmp = this.convertToArray(this.book.relatedItem.note);
      for (i = 0; i < tmp.length; i++) {
        if (tmp[i] && tmp[i]._ && !this.isInArray(this.bookDetails.notes, tmp[i]._)) {
          this.bookDetails.notes.push(tmp[i]._);
          this.bookDetails.noDetails = false;
        } else if (typeof tmp[i] === "string" && !this.isInArray(this.bookDetails.notes, tmp[i])) {
          this.bookDetails.notes.push(tmp[i]);
          this.bookDetails.noDetails = false;
        } 
      }
    }
  }

  getAbstractAndTOC() {
    var i,j;
    if (this.book.abstract) {
      let tmp = this.convertToArray(this.book.abstract);

      for (i = 0; i < tmp.length; i++) {
        if (tmp[i] && tmp[i].indexOf("--") >= 0) {
          let toc = tmp[i].split("--");
          for (j = 0; j < toc.length; j++) {
            if (toc[j] != "") {
              this.bookDetails.toc.push(toc[j]);
              this.bookDetails.noDetails = false;
            }
          }
        } else {
          this.bookDetails.abstract += tmp[i];
          this.bookDetails.noDetails = false;
        }
      }
    }

    if (this.bookDetails.abstract.length > 280) {
      this.bookDetails.shortAbstract = this.bookDetails.abstract.substring(0,279) + "...";
      this.shortAbstract = true;
    }
  }

  setMediaType(mediatype) {
    this.bookDetails.mediaType = mediatype;
  }

  openWithInAppBrowser(url:string) {
    let target = "_blank";
    this.theInAppBrowser.create(url,target);
  }

  openWithSafari(url:string) {
    this.safari.show({
      url: url
    }).subscribe(result => {console.log(result);}, error => { console.log(error); })
  }

  openWebsite(url:string) {
    if (this.platform.is("cordova")) {
      this.safari.isAvailable().then((available:boolean) => {
        if (available) {
          this.openWithSafari(url);
        } else { this.openWithInAppBrowser(url); }
      });
    } else {
      this.openWithInAppBrowser(url);
    }
  } 

}
