import { Component, Input } from '@angular/core';
import {
  IPulsAPIResponse_getLectureScheduleRoot,
  IPulsAPIResponse_getLectureScheduleSubTree,
  IPulsAPIResponse_getLectureScheduleCourses,
  IPulsAPIResponse_getCourseData
} from "../../library/interfaces_PULS";
import { CacheService } from 'ionic-cache';
import { utils } from '../../library/util';
import { ConnectionProvider } from '../../providers/connection/connection';
import { PulsProvider } from '../../providers/puls/puls';
import { of } from 'rxjs/observable/of';

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

  constructor(private cache: CacheService,
              private connection: ConnectionProvider,
              private puls:PulsProvider) {
  }

  async ngOnInit() {
    this.connection.checkOnline(true, true);

    if (this.headerIdInput) {
      this.headerId = this.headerIdInput;
    }
    if (this.hasSubTreeInput) {
      this.hasSubTree = true;
    }

    if (!this.headerId) {
      this.cache.loadFromObservable('getLectureScheduleRoot', of(this.puls.getLectureScheduleRoot().subscribe(
        (response:IPulsAPIResponse_getLectureScheduleRoot) => {
          this.lectureSchedule = response;
        }
      )));
    } else if (this.hasSubTree) {
      this.cache.loadFromObservable('getLectureScheduleSubTree'+this.headerId, of(this.puls.getLectureScheduleSubTree(this.headerId).subscribe(
        (response:IPulsAPIResponse_getLectureScheduleSubTree) => {
          this.lectureSchedule = response;
        }
      )));
    } else {
      this.cache.loadFromObservable('getLectureScheduleCourses'+this.headerId, of(this.puls.getLectureScheduleCourses(this.headerId).subscribe(
        (response:IPulsAPIResponse_getLectureScheduleCourses) => {
          this.lectureSchedule = response;
        }
      )));
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

  /**
   * @name expandCourse
   * @param course
   */
  expandCourse(course): void {

    if (course.courseId) {
      let courseId = course.courseId;

      this.cache.loadFromObservable('getCourseData'+courseId, of(this.puls.getCourseData(courseId).subscribe(
        (response:IPulsAPIResponse_getCourseData) => {
          this.courseData[courseId] = response;

          let i;
          this.courseGroups[courseId] = [];
          // check how many different groups exist
          let tmp = utils.convertToArray(utils.convertToArray(this.courseData[courseId].courseData.course)[0].events.event);
          for (i = 0; i < tmp.length; i++) {
            if (!utils.isInArray(this.courseGroups[courseId], tmp[i].groupId)) {
              this.courseGroups[courseId].push(tmp[i].groupId);
            }
          }
        }
      )));

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

  /**
   * TODO: can be removed when bug in api is fixed
   * @name checkDoubledLecturers
   * @param event
   * @param lecturer
   * @param index
   */
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