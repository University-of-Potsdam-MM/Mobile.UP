import { Component, Input, Output, EventEmitter } from '@angular/core';
import { utils } from '../../library/util';

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
    this.checkMediaType(utils.convertToArray(this.book.typeOfResource)[0], utils.convertToArray(this.book.originInfo)[0], utils.convertToArray(this.book.physicalDescription)[0]);
    this.getPublisher();
  }

  /**
   * @name getPublisher
   */
  getPublisher() {
    if (this.book.relatedItem) {
      let tmp = utils.convertToArray(this.book.relatedItem);
      let i;
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

  /**
   * @name checkMediaType
   * @param typeOfResource
   * @param originInfo
   * @param physicalDescription
   */
  checkMediaType(typeOfResource, originInfo, physicalDescription) {

    let physicalDescriptionArr = utils.convertToArray(physicalDescription.form);
    if (physicalDescription) {
      physicalDescription = physicalDescriptionArr.filter(x => x._ == 'remote' || x._ == 'microform');
      if (physicalDescription[0]){ physicalDescription = physicalDescription[0]._; }
    }
    if (typeOfResource._) { typeOfResource = typeOfResource._ }

    if (physicalDescription == 'microform'){
      this.mediaType.emit("mediatype_e");
    }

    let soundRec:boolean = typeOfResource.includes("sound recording");

    //console.log(originInfo.issuance, physicalDescription, typeOfResource);

    if (physicalDescription === 'remote'){
      this.mediaType.emit("mediatype_o");
      this.bookDetails.icon = "cloud-outline"; // O = Online
      return;
    }

    if (typeOfResource) {
      switch(typeOfResource) {
        case 'manuscript': {
          this.mediaType.emit('mediatype_h');
          this.bookDetails.icon = 'help'; // H = ???
          break;
        }
        case 'still image': {
          this.mediaType.emit('mediatype_i');
          this.bookDetails.icon = 'ios-image-outline'; // I = Image
          break;
        }
        case 'cartographic': {
          this.mediaType.emit('mediatype_k');
          this.bookDetails.icon = 'ios-map-outline'; // K = Kartografie
          break;
        }
        case 'notated music': {
          this.mediaType.emit('mediatype_m');
          this.bookDetails.icon = 'ios-musical-notes-outline'; // M = Music
          break;
        }
        case 'moving image': {
          this.mediaType.emit('mediatype_v');
          this.bookDetails.icon = 'ios-videocam-outline'; // V = Video
          break;
        }
        case 'text': {
          if (originInfo && (originInfo.issuance === 'serial' || originInfo.issuance === 'continuing')) {
            this.mediaType.emit('mediatype_t');
            this.bookDetails.icon = 'ios-document-outline'; // T = Text
            break;
          } else {
            this.mediaType.emit('mediatype_b');
            this.bookDetails.icon = 'md-bookmarks'; // B = Book
            break;
          }
        }
        case 'software, multimedia': {
          //console.log('software?');
          if (originInfo && (originInfo.issuance == "serial" || originInfo.issuance == "continuing")) {
            if (physicalDescription === 'remote') {
              this.mediaType.emit("mediatype_p");
              this.bookDetails.icon = "ios-paper-outline"; // P = Paper
              break;
            } else {
              this.mediaType.emit('mediatype_t');
              this.bookDetails.icon = 'ios-document-outline'; // T = Text
              break;
            }
          } else if (physicalDescription === 'remote') {
            this.mediaType.emit('mediatype_o');
            this.bookDetails.icon = 'cloud-outline'; // O = Online
            break;
          } else {
            this.mediaType.emit('mediatype_s');
            this.bookDetails.icon = 'ios-disc-outline'; // S = Software
            break;
          }
        }
        default: {
          if (soundRec) {
            this.mediaType.emit('mediatype_g');
            this.bookDetails.icon = 'volume-up'; // G = Recordings
            break;
          } else {
            this.mediaType.emit('mediatype_x');
            this.bookDetails.icon = 'help'; // X = undefined
            break;
          }
        }
      }
    }

  }

  /**
   * has to be declared for html pages to use the imported function
   * couldn't find a better solution
   * @param array
   */
  convertToArray(array) {
    return utils.convertToArray(array)
  }

}