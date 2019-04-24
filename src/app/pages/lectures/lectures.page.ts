import { Component, OnInit } from '@angular/core';
import { AbstractPage } from 'src/app/lib/abstract-page';
import { CacheService } from 'ionic-cache';
import { PulsService } from 'src/app/services/puls/puls.service';
import { IPulsAPIResponse_getLectureScheduleAll } from 'src/app/lib/interfaces_PULS';
import { of } from 'rxjs';
import { utils } from 'src/app/lib/util';
import { LectureSearchModalPage } from './lecture-search.modal';
import { ModalController, Platform } from '@ionic/angular';
import { Keyboard } from '@ionic-native/keyboard/ngx';

@Component({
  selector: 'app-lectures',
  templateUrl: './lectures.page.html',
  styleUrls: ['./lectures.page.scss'],
})
export class LecturesPage extends AbstractPage implements OnInit {

  constructor(
    private cache: CacheService,
    private puls: PulsService,
    private modalCtrl: ModalController,
    private platform: Platform,
    private keyboard: Keyboard
  ) {
    super({ requireNetwork: true });
  }

  isLoaded;
  isSearching;
  allLectures;
  lectures;
  flattenedLectures;
  searchResults = [];
  resultKeys = [];
  query = '';
  modalOpen;

  valueArray = [];

  ngOnInit() {
    this.loadLectureTree();
  }

  loadLectureTree(refresher?) {
    if (refresher) {
      this.cache.removeItem('lectureScheduleAll');
    } else { this.isLoaded = false; }

    this.cache.loadFromObservable('lectureScheduleAll', of(this.puls.getLectureScheduleAll().subscribe(
      (response: IPulsAPIResponse_getLectureScheduleAll) => {
      if (refresher) {
        refresher.target.complete();
      }

      this.allLectures = response;
      this.lectures = this.allLectures;
      this.flattenedLectures = this.flattenJSON(response, '', {});

      this.isLoaded = true;
    })));
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

  searchLecture(event) {
    if (this.isLoaded) {
      this.query = event.detail.value.trim();
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
    }

    const modal = await this.modalCtrl.create({
      backdropDismiss: false,
      component: LectureSearchModalPage,
      componentProps: { item: toOpen, isCourse: isCourse, name: name }
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

}
