import { Component, OnInit } from '@angular/core';
import { AbstractPage } from 'src/app/lib/abstract-page';
import { IPulsAPIResponse_getLectureScheduleAll } from 'src/app/lib/interfaces_PULS';
import { utils } from 'src/app/lib/util';
import { LectureSearchModalPage } from './lecture-search.modal';
import { ModalController, Platform } from '@ionic/angular';
import { Keyboard } from '@ionic-native/keyboard/ngx';
import { WebserviceWrapperService } from '../../services/webservice-wrapper/webservice-wrapper.service';

@Component({
  selector: 'app-lectures',
  templateUrl: './lectures.page.html',
  styleUrls: ['./lectures.page.scss'],
})
export class LecturesPage extends AbstractPage implements OnInit {

  constructor(
    private ws: WebserviceWrapperService,
    private modalCtrl: ModalController,
    private platform: Platform,
    private keyboard: Keyboard
  ) {
    super({ optionalNetwork: true });
  }

  isLoaded;
  isSearching;
  isRefreshing;
  refreshLectureComponent = false;
  allLectures;
  lectures;
  flattenedLectures;
  searchResults = [];
  resultKeys = [];
  query = '';
  networkError;
  modalOpen;
  valueArray = [];

  ngOnInit() {
    this.loadLectureTree();
  }

  refreshLectureTree(refresher) {
    this.isRefreshing = true;
    this.refreshLectureComponent = true;
    this.query = '';
    this.searchLecture();
    this.isLoaded = false;
    this.loadLectureTree(true);
    setTimeout(() => {
      refresher.target.complete();
      this.isRefreshing = false;
    }, 500);
  }

  loadLectureTree(forceRefresh: boolean = false) {
    this.isLoaded = false;
    this.networkError = false;

    this.ws.call(
      'pulsGetLectureScheduleAll',
      {},
      { forceRefresh: forceRefresh }
    ).subscribe((response: IPulsAPIResponse_getLectureScheduleAll) => {
      this.allLectures = response;
      this.lectures = this.allLectures;
      this.flattenedLectures = this.flattenJSON(response, '', {});

      this.isLoaded = true;
    }, error => {
      console.log(error);
      this.isLoaded = true;
      this.networkError = true;
    });
  }

  flattenJSON(cur, prop, result) {
    if (Object(cur) !== cur) {
      if (utils.contains(prop, 'name')) {
        result[prop] = cur;
      }
    } else if (Array.isArray(cur)) {
      const l = cur.length;
      for (let i = 0; i < l; i++) {
        result = this.flattenJSON(cur[i], prop ? prop + '.' + i : ' + i', result);
      }

      if (l === 0) {
        result[prop] = [];
      }
    } else {
      let isEmpty = true;
      for (const p in cur) {
        if (p) {
          isEmpty = false;
          result = this.flattenJSON(cur[p], prop ? prop + '.' + p : p, result);
        }
      }

      if (isEmpty) {
        result[prop] = {};
      }
    }

    return result;
  }

  searchLecture(event?) {
    if (event) { this.query = event.detail.value.trim(); }
    this.searchResults = [];
    this.resultKeys = [];

    if (this.query && this.query.length > 2) {
      this.isSearching = true;
      if (this.valueArray.length === 1) {
        this.searchResults = this.getValues(this.valueArray[0]);
      } else { this.searchResults = this.getValues(); }
      this.isSearching = false;
    }
  }

  getValues(filterKey?: string) {
    const objects = [];
    for (const i in this.flattenedLectures) {
      if (this.flattenedLectures.hasOwnProperty(i)) {
        if (utils.contains(this.flattenedLectures[i], this.query)) {
          if (utils.contains(i, 'courseName')) {
            // check if course has already been added
            // since course often are listed multiple times
            if (!utils.isInArray(objects, this.flattenedLectures[i])) {
              if (filterKey) {
                if (utils.contains(i, filterKey)) {
                  objects.push(this.flattenedLectures[i]);
                  this.resultKeys.push(i);
                }
              } else {
                objects.push(this.flattenedLectures[i]);
                this.resultKeys.push(i);
              }
            }
          } else {
            if (filterKey) {
              if (utils.contains(i, filterKey)) {
                objects.push(this.flattenedLectures[i]);
                this.resultKeys.push(i);
              }
            } else {
              objects.push(this.flattenedLectures[i]);
              this.resultKeys.push(i);
            }
          }
        }
      }
    }
    return objects;
  }

  async openItem(index) {
    const name = this.searchResults[index];
    const ref = this.resultKeys[index].replace('courseName', 'courseId');
    const isCourse = utils.contains(ref, 'courseId');

    const pathKeys = utils.convertToArray(ref.split('.'));

    let toOpen = this.allLectures;
    const itemTree = [];
    for (let i = 0; i < pathKeys.length - 1; i++) {
      // getting course or directory
      if (i > (pathKeys.length - 3)) {
        if (isCourse) {
          // getting the courseId
          toOpen = toOpen[pathKeys[i]];
        }
      } else {
        toOpen = toOpen[pathKeys[i]];
      }

      if (!Array.isArray(toOpen)) {
        let treeItemName;
        if (toOpen.courseName) {
          treeItemName = toOpen.courseName;
        } else if (toOpen.headerName) {
          treeItemName = toOpen.headerName;
        } else if (toOpen.childNode && toOpen.childNode.headerName) {
          treeItemName = toOpen.childNode.headerName;
        }

        if (treeItemName && treeItemName !==  'Vorlesungsverzeichnis' && !utils.isInArray(itemTree, treeItemName)) {
          itemTree.push(this.unescapeHTML(treeItemName));
        }
      }
    }

    const modal = await this.modalCtrl.create({
      backdropDismiss: false,
      component: LectureSearchModalPage,
      componentProps: { item: toOpen, isCourse: isCourse, name: name, itemTree: itemTree }
    });
    modal.present();
    this.modalOpen = true;
    await modal.onDidDismiss();
    this.modalOpen = false;
  }

  selectFilter(event) {
    this.valueArray = utils.convertToArray(event.detail.value);

    this.searchResults = [];
    this.resultKeys = [];
    this.isSearching = true;
    if (this.valueArray.length === 1) {
      this.searchResults = this.getValues(this.valueArray[0]);
    } else { this.searchResults = this.getValues(); }
    this.isSearching = false;
  }

  contains(x, y) {
    return utils.contains(x, y);
  }

  // hides keyboard once the user is scrolling
  onScrollListener() {
    if (this.platform.is('cordova') && (this.platform.is('ios') || this.platform.is('android'))) {
      this.keyboard.hide();
    }
  }

  unescapeHTML(s: string) { // replaces &colon; in strings, unescape / decodeURI didnt work (?)
    return s.replace(/&colon;/g, ':');
  }
}
