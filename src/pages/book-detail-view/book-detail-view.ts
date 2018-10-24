import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Item } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { IConfig } from '../../library/interfaces';
import { HttpClient } from '@angular/common/http';
import * as moment from 'moment';

@IonicPage()
@Component({
  selector: 'page-book-detail-view',
  templateUrl: 'book-detail-view.html',
})
export class BookDetailViewPage {

  book;
  activeSegment = "location";
  config:IConfig;

  bookLocation;
  mediaType;

  bookDetails = {
    "url": null
  };

  constructor(public navCtrl: NavController, public navParams: NavParams, private storage: Storage, private http: HttpClient) {
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
      var locationModel = {
        department:     this.getDepartment(data),
        departmentURL:  this.getDepartmentURL(data),
        label:          this.getLabel(data),
        item:           this.getItem(data),
        url:            this.getBookUrl(data)
      }
      this.bookLocation = locationModel;
    }, error => {
      console.log(error);
    })
  }

  getDepartment(data) {
    var department = "";
    if (data.department && data.department.content) {
      department = data.department.content;
    }
    if (data.storage) {
      department = department + ", " + data.storage.content;
    }
    return department;
  }

  getDepartmentURL(data) {
    if (data.department && data.department.id) {
      return data.department.id;
    } else { return ""; }
  }

  getLabel(data) {
    if (data.label) {
      return data.label
    } else { return ""; }
  }

  getBookUrl(data) {
    if (this.mediaType == "mediatype_o") {
      var url;
      if (data.unavailable && data.unavailable[0].service == "openaccess") {
        url = data.unavailable[0].href;
      } else { url = null; }
      if (url != null) { this.bookDetails.url = url; }
      return url;
    }
  }

  getItem(data) {
    var status = "", statusInfo = "";

    // check for available / unavailable items and process loan and presentation
    if (data.available) {
      var loanAvailable, presentationAvailable;
      let availableArray = this.convertToArray(data.available);
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

    if (data.unavailable) {
      var loanUnavailable, presentationUnavailable;
      let unavailableArray = this.convertToArray(data.available);
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
        if (this.bookDetails.url == null) {
          if (data.label && data.label.indexOf("bestellt") != -1) {
            status = data.label;
            statusInfo = "";
          } else {
            status = "Präsenzbestand";
            if (presentationAvailable.href) {
              statusInfo = presentationAvailable.href;
            }
          }
        } else {
          status = "Online-Ressource im Browser öffnen";
        }
      }

      if (presentationUnavailable) {
        if (loanUnavailable.href) {
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

}
