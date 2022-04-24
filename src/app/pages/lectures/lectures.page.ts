import { Component, OnInit } from '@angular/core';
import { Keyboard } from '@capacitor/keyboard';
import { ModalController } from '@ionic/angular';
import { AbstractPage } from 'src/app/lib/abstract-page';
import { IPulsAPIResponse_getLectureScheduleAll } from 'src/app/lib/interfaces_PULS';
import { contains, convertToArray, isInArray } from 'src/app/lib/util';
import { WebserviceWrapperService } from '../../services/webservice-wrapper/webservice-wrapper.service';
import { LectureSearchModalPage } from './lecture-search.modal';

@Component({
  selector: 'app-lectures',
  templateUrl: './lectures.page.html',
  styleUrls: ['./lectures.page.scss'],
})
export class LecturesPage extends AbstractPage implements OnInit {
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
  valueArray = [];
  queryTooShort = false;

  constructor(
    private ws: WebserviceWrapperService,
    private modalCtrl: ModalController
  ) {
    super({ optionalNetwork: true });
  }

  ngOnInit() {
    this.loadLectureTree();
  }

  refreshLectureTree(refresher?) {
    this.isRefreshing = true;
    this.refreshLectureComponent = true;
    this.query = '';
    this.searchLecture();
    this.isLoaded = false;
    this.loadLectureTree(true);
    setTimeout(() => {
      if (refresher) {
        refresher.target.complete();
      }
      this.isRefreshing = false;
    }, 500);
  }

  loadLectureTree(forceRef = false) {
    this.isLoaded = false;
    this.networkError = false;

    this.ws
      .call('pulsGetLectureScheduleAll', {}, { forceRefresh: forceRef })
      .subscribe(
        (response: IPulsAPIResponse_getLectureScheduleAll) => {
          this.allLectures = response;
          this.lectures = this.allLectures;
          this.flattenedLectures = this.flattenJSON(response, '', {});

          this.isLoaded = true;
        },
        () => {
          this.isLoaded = true;
          this.networkError = true;
        }
      );
  }

  flattenJSON(cur, prop, result) {
    if (Object(cur) !== cur) {
      if (contains(prop, 'name')) {
        result[prop] = cur;
      }
    } else if (Array.isArray(cur)) {
      const l = cur.length;
      for (let i = 0; i < l; i++) {
        result = this.flattenJSON(
          cur[i],
          prop ? prop + '.' + i : ' + i',
          result
        );
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
    if (event) {
      this.query = event.detail.value.trim();
    }
    this.searchResults = [];
    this.resultKeys = [];
    this.queryTooShort = false;

    if (this.query && this.query.length > 2) {
      this.isSearching = true;
      if (this.valueArray.length === 1) {
        this.searchResults = this.getValues(this.valueArray[0]);
      } else {
        this.searchResults = this.getValues();
      }
    } else if (this.query && this.query.length > 0 && this.query.length < 3) {
      this.queryTooShort = true;
    }
  }

  getValues(filterKey?: string) {
    const objects = [];
    for (const i in this.flattenedLectures) {
      if (contains(this.flattenedLectures[i], this.query)) {
        if (contains(i, 'courseName')) {
          // check if course has already been added
          // since course often are listed multiple times
          if (!isInArray(objects, this.flattenedLectures[i])) {
            if (filterKey) {
              if (contains(i, filterKey)) {
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
            if (contains(i, filterKey)) {
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

    setTimeout(() => {
      this.isSearching = false;
    }, 500);

    return objects;
  }

  async openItem(index) {
    const localName = this.searchResults[index];
    let ref = this.resultKeys[index];
    if (ref) {
      ref = ref.replace('courseName', 'courseId');
    }
    const hasCourseId = contains(ref, 'courseId');

    const pathKeys = convertToArray(ref.split('.'));

    let toOpen = this.allLectures;
    const localItemTree = [];
    for (let i = 0; i < pathKeys.length - 1; i++) {
      // getting course or directory
      if (i > pathKeys.length - 3) {
        if (hasCourseId) {
          // getting the courseId
          toOpen = toOpen[pathKeys[i]];
        }
      } else {
        toOpen = toOpen[pathKeys[i]];
      }

      if (toOpen && !Array.isArray(toOpen)) {
        let treeItemName;
        if (toOpen.courseName) {
          treeItemName = toOpen.courseName;
        } else if (toOpen.headerName) {
          treeItemName = toOpen.headerName;
        } else if (toOpen.childNode && toOpen.childNode.headerName) {
          treeItemName = toOpen.childNode.headerName;
        }

        if (
          treeItemName &&
          treeItemName !== 'Vorlesungsverzeichnis' &&
          !isInArray(localItemTree, treeItemName)
        ) {
          localItemTree.push(this.unescapeHTML(treeItemName));
        }
      }
    }

    const modal = await this.modalCtrl.create({
      backdropDismiss: false,
      component: LectureSearchModalPage,
      componentProps: {
        item: toOpen,
        isCourse: hasCourseId,
        name: localName,
        itemTree: localItemTree,
      },
    });
    modal.present();
    await modal.onDidDismiss();
  }

  selectFilter(event) {
    this.valueArray = convertToArray(event.detail.value);

    this.searchResults = [];
    this.resultKeys = [];
    this.isSearching = true;
    if (this.valueArray.length === 1) {
      this.searchResults = this.getValues(this.valueArray[0]);
    } else {
      this.searchResults = this.getValues();
    }
    this.isSearching = false;
  }

  contains(x, y) {
    return contains(x, y);
  }

  // hides keyboard once the user is scrolling
  onScrollListener() {
    if (this.platform.is('ios') || this.platform.is('android')) {
      Keyboard.hide();
    }
  }

  unescapeHTML(s: string) {
    // replaces &colon; in strings, unescape / decodeURI didnt work (?)
    if (s !== undefined) {
      return s.replace(/&colon;/g, ':');
    } else {
      return '';
    }
  }
}
