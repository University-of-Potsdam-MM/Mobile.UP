import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'book-list-view',
  templateUrl: 'book-list-view.html'
})
export class BookListViewComponent {

  @Input() public book:any;
  @Input() public i;
  @Output() mediaType = new EventEmitter();

  bookDetails = {
    "icon": null,
    "publisher": ""
  };

  constructor() {
  }

  ngOnInit() {
    this.checkMediaType(this.convertToArray(this.book.typeOfResource)[0], this.convertToArray(this.book.originInfo)[0], this.convertToArray(this.book.physicalDescription)[0]);
    this.getPublisher();
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

  getPublisher() {
    if (this.book.relatedItem) {
      let tmp = this.convertToArray(this.book.relatedItem);
      var i;
      for (i = 0; i < tmp.length; i++) {
        if (tmp[i].originInfo && tmp[i].originInfo.publisher) {
          if (tmp[i].originInfo.publisher.trim().length > 0) {
            this.bookDetails.publisher = tmp[i].originInfo.publisher;
            break;
          }
        }
      }
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
          this.bookDetails.icon = "help"; // E = ???
          return;
        }
      }
    }

    if (typeOfResource._) { typeOfResource = typeOfResource._ }
    let soundRec:boolean = typeOfResource.includes("sound recording");
    if (typeOfResource) {
      switch(typeOfResource) {
        case "manuscript": {
          this.mediaType.emit("mediatype_h");
          this.bookDetails.icon = "help"; // H = ???
          return;
        }
        case "still image": {
          this.mediaType.emit("mediatype_i");
          this.bookDetails.icon = "ios-image-outline"; // I = Image
          return;
        }
        case "cartographic": {
          this.mediaType.emit("mediatype_k");
          this.bookDetails.icon = "ios-map-outline"; // K = Kartografie
          return;
        }
        case "notated music": {
          this.mediaType.emit("mediatype_m");
          this.bookDetails.icon = "ios-musical-notes-outline"; // M = Music
          return;
        }
        case "moving image": {
          this.mediaType.emit("mediatype_v");
          this.bookDetails.icon = "ios-videocam-outline"; // V = Video
          return;
        }
        case "text": {
          if (originInfo && (originInfo.issuance == "serial" || originInfo.issuance == "continuing")) {
            this.mediaType.emit("mediatype_t");
            this.bookDetails.icon = "ios-document-outline"; // T = Text
            return;
          } else {
            this.mediaType.emit("mediatype_b");
            this.bookDetails.icon = "md-bookmarks"; // B = Book
            return;
          }
        }
        case "software, multimedia": {
          if (originInfo && (originInfo.issuance == "serial" || originInfo.issuance == "continuing")) {
            if (isRemote) {
              this.mediaType.emit("mediatype_p");
              this.bookDetails.icon = "ios-paper-outline"; // P = Paper
              return;
            } else {
              this.mediaType.emit("mediatype_t");
              this.bookDetails.icon = "ios-document-outline"; // T = Text
              return;
            }
          } else if (isRemote) {
            this.mediaType.emit("mediatype_o");
            this.bookDetails.icon = "cloud-outline"; // O = Online
            return;
          } else {
            this.mediaType.emit("mediatype_s");
            this.bookDetails.icon = "ios-disc-outline"; // S = Software
            return;
          }
        }
        default: {
          if (soundRec) {
            this.mediaType.emit("mediatype_g");
            this.bookDetails.icon = "volume-up"; // G = Recordings
            return;
          } else {
            this.mediaType.emit("mediatype_x");
            this.bookDetails.icon = "help"; // X = undefined
            return;
          }
        }
      }
    }

  }

}