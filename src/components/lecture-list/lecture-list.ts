import { Component, Input } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Storage } from '@ionic/storage';
import { IConfig } from '../../library/interfaces';
import { CacheService } from 'ionic-cache';
import { utils } from '../../library/util';

@Component({
  selector: 'lecture-list',
  templateUrl: 'lecture-list.html'
})
export class LectureListComponent {

  @Input() headerIdInput: string;
  @Input() hasSubTreeInput;
  headerId: string;
  hasSubTree;

  authToken;
  endpointUrl;

  lectureSchedule;
  isExpanded = [];
  isExpandedCourse = [];

  courseData = [];
  courseGroups = [];
  lecturerList = [];

  constructor(private http: HttpClient,
              private storage: Storage,
              private cache: CacheService) {
  }

  ngOnInit() {
    this.storage.get('config').then((config:IConfig) => {
      this.authToken = config.webservices.apiToken;
      this.endpointUrl = config.webservices.endpoint.puls;
      this.getLectureData();
    });
  }

  /**
   * @name getLectureData
   */
  getLectureData(): void {

    if (this.headerIdInput) {
      this.headerId = this.headerIdInput;
    }

    if (this.hasSubTreeInput) {
      this.hasSubTree = true;
    }

    let headers = new HttpHeaders()
      .append('Authorization', this.authToken);

    if (!this.headerId) {
      let url = this.endpointUrl + 'getLectureScheduleRoot';
      let request = this.http.post(url, {condition:{semester:0}}, {headers:headers});

      this.cache.loadFromObservable('getLectureScheduleRoot', request).subscribe( (data) => {
        //console.log(data);
        this.lectureSchedule = data;
      });
    } else if (this.hasSubTree) {
      let url = this.endpointUrl + 'getLectureScheduleSubTree';
      let request = this.http.post(url, {condition:{headerId:this.headerId}}, {headers:headers});

      this.cache.loadFromObservable("getLectureScheduleSubTree"+this.headerId, request).subscribe(data => {
        //console.log(data);
        this.lectureSchedule = data;
      });
    } else {
      let url = this.endpointUrl + 'getLectureScheduleCourses';
      let request = this.http.post(url, {condition:{headerId:this.headerId}}, {headers:headers});

      this.cache.loadFromObservable('getLectureScheduleCourses'+this.headerId, request).subscribe(data => {
        //console.log(data);
        this.lectureSchedule = data;
      });
    }
  }

  /**
   * @name expandChild
   * @param childNode
   */
  expandChild(childNode): void {
    //console.log(childNode);

    if (childNode.subNodes) {
      if (Number(childNode.subNodes.count) > 0) {
        this.hasSubTree = true;
      } else { this.hasSubTree = false; }
    } else { this.hasSubTree = false; }

    if (childNode.headerId) {
      this.headerId = childNode.headerId;

      if (this.isExpanded[childNode.headerId]) {
        this.isExpanded[childNode.headerId] = false;
      } else { this.isExpanded[childNode.headerId] = true; }
    }
  }

  expandCourse(course) {

    if (course.courseId) {
      let courseId = course.courseId;

      let url = this.endpointUrl + 'getCourseData';

      let headers = new HttpHeaders()
        .append('Authorization', this.authToken);

      let request = this.http.post(url, {condition:{courseId:courseId}}, {headers:headers});

      this.cache.loadFromObservable('getCourseData'+courseId, request).subscribe(data => {
        //console.log(data);
        this.courseData[courseId] = data;

        let i;
        this.courseGroups[courseId] = [];

        // check how many different groups exist
        let tmp = utils.convertToArray(utils.convertToArray(this.courseData[courseId].courseData.course)[0].events.event);
        for (i = 0; i < tmp.length; i++) {
          if (!utils.isInArray(this.courseGroups[courseId], tmp[i].groupId)) {
            this.courseGroups[courseId].push(tmp[i].groupId);
          }
        }
      });

      if (this.isExpandedCourse[courseId]) {
        this.isExpandedCourse[courseId] = false;
      } else {
        this.isExpandedCourse[courseId] = true;
        //console.log(course);
      }
    }
  }

  /**
   * @name replaceUnderscore
   * @param {string} roomSc
   */
  replaceUnderscore(roomSc:string) {
    if (roomSc !== undefined) {
      return roomSc.replace(/_/g, '.');
    } else {
      return ''
    }
  }

  checkDoubledLecturers(event, lecturer, index) {
    if (event.eventId && lecturer.lecturerId) {
      if ((this.lecturerList[event.eventId] !== undefined)  && (this.lecturerList[event.eventId].length > 0)) {
        if (utils.isInArray(this.lecturerList[event.eventId], [lecturer.lecturerId][index])) {
          return true;
        } else {
          let i;
          let alreadyIn = false;
          for (i = 0; i < this.lecturerList.length; i++) {
            if ((this.lecturerList[i] !== undefined) && (this.lecturerList[i][0] === lecturer.lecturerId)) {
              alreadyIn = true;
            }
          }

          if (alreadyIn) { return false; } else {
            this.lecturerList[event.eventId].push([lecturer.lecturerId][index]);
            return true;
          }
        }
      } else {
        this.lecturerList[event.eventId] = [];
        this.lecturerList[event.eventId].push([lecturer.lecturerId][index]);
        return true;
      }
    }
  }

  /**
   * @name htmlDecode
   * @param input
   */
  htmlDecode(input) {
    let doc = new DOMParser().parseFromString(input, 'text/html');
    return doc.documentElement.textContent;
  }

  /**
   * has to be declared for html pages to use the imported function
   * couldn't find a better solution
   * @param array
   */
  convertToArray(array) {
    return utils.convertToArray(array);
  }

}
