import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'book-list-view',
  templateUrl: 'book-list-view.html'
})
export class BookListViewComponent {

  @Input() public book:any;
  @Input() public i;
  @Output() mediaType = new EventEmitter();
  constructor() {
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
          this.mediaType.emit("mediatype_e");
          return "help"; // E = ???
        }
      }
    }

    if (typeOfResource._) { typeOfResource = typeOfResource._ }
    let soundRec:boolean = typeOfResource.includes("sound recording");
    if (typeOfResource) {
      switch(typeOfResource) {
        case "manuscript": {
          this.mediaType.emit("mediatype_h");
          return "help"; // H = ???
        }
        case "still image": {
          this.mediaType.emit("mediatype_i");
          return "ios-image-outline"; // I = Image
        }
        case "cartographic": {
          this.mediaType.emit("mediatype_k");
          return "ios-map-outline"; // K = Kartografie
        }
        case "notated music": {
          this.mediaType.emit("mediatype_m");
          return "ios-musical-notes-outline"; // M = Music
        }
        case "moving image": {
          this.mediaType.emit("mediatype_v");
          return "ios-videocam-outline"; // V = Video
        }
        case "text": {
          if (originInfo && (originInfo.issuance == "serial" || originInfo.issuance == "continuing")) {
            this.mediaType.emit("mediatype_t");
            return "ios-document-outline"; // T = Text
          } else {
            this.mediaType.emit("mediatype_b");
            return "md-bookmarks"; // B = Book
          }
        }
        case "software, multimedia": {
          if (originInfo && (originInfo.issuance == "serial" || originInfo.issuance == "continuing")) {
            if (isRemote) {
              this.mediaType.emit("mediatype_p");
              return "ios-paper-outline"; // P = Paper
            } else {
              this.mediaType.emit("mediatype_t");
              return "ios-document-outline"; // T = Text
            }
          } else if (isRemote) {
            this.mediaType.emit("mediatype_o");
            return "cloud-outline"; // O = Online
          } else {
            this.mediaType.emit("mediatype_s");
            return "ios-disc-outline"; // S = Software
          }
        }
        default: {
          if (soundRec) {
            this.mediaType.emit("mediatype_g");
            return "volume-up"; // G = Recordings
          } else {
            this.mediaType.emit("mediatype_x");
            return "help"; // X = undefined
          }
        }
      }
    }

  }

}
