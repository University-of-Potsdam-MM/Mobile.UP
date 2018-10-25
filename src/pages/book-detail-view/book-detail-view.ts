import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Platform } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { IConfig } from '../../library/interfaces';
import { HttpClient } from '@angular/common/http';
import * as moment from 'moment';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { SafariViewController } from '@ionic-native/safari-view-controller';

@IonicPage()
@Component({
  selector: 'page-book-detail-view',
  templateUrl: 'book-detail-view.html',
})
export class BookDetailViewPage {

  book;
  activeSegment = "location";
  config:IConfig;

  bookLocationList;
  mediaType;
  showLocation = true;
  showDetails = false;

  bookDetails = {
    "url": null
  };

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    private storage: Storage,
    private http: HttpClient,
    private theInAppBrowser: InAppBrowser,
    private platform: Platform,
    private safari: SafariViewController) {
    this.book = this.navParams.data["book"];
    console.log(this.book);
  }

  async ngOnInit() {
    this.config = await this.storage.get("config");
    this.updateLocation();
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

  updateLocation() {
    let url = this.config.webservices.endpoint.libraryDAIA + this.book.recordInfo.recordIdentifier._ + "&format=json";
    this.http.get(url).subscribe(data => {
      this.setLocationData(data);
    }, error => {
      console.log(error);
    });
  }

  setLocationData(data) {
    console.log(data);
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
    console.log(this.bookLocationList);
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

    if (this.mediaType == "mediatype_o") {
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
        if (availableArray[i].service == "loan") {
          loanAvailable = availableArray[i];
        }
        if (availableArray[i].service == "presentation") {
          presentationAvailable = availableArray[i];
        }
      }
    }

    if (item.unavailable) {
      var loanUnavailable, presentationUnavailable;
      let unavailableArray = this.convertToArray(item.available);
      var j;
      for (j = 0; j < unavailableArray.length; j++) {
        if (unavailableArray[j].service == "loan") {
          loanUnavailable = unavailableArray[j];
        }
        if (unavailableArray[j].service == "presentation") {
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

  setMediaType(mediatype) {
    this.mediaType = mediatype;
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
    if (this.platform.is("ios") || this.platform.is("android")) {
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
