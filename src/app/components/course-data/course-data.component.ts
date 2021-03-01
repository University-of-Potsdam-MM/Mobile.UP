import { Component, OnInit, Input } from "@angular/core";
import { IPulsAPIResponse_getCourseData } from "src/app/lib/interfaces_PULS";
import { WebserviceWrapperService } from "../../services/webservice-wrapper/webservice-wrapper.service";
import { Logger, LoggingService } from "ionic-logging-service";
import { convertToArray, isInArray } from "src/app/lib/util";

@Component({
  selector: "app-course-data",
  templateUrl: "./course-data.component.html",
  styleUrls: ["./course-data.component.scss"],
})
export class CourseDataComponent implements OnInit {
  @Input() course;
  @Input() refresh = false;
  courseData;
  courseGroups = [];
  lecturerList = [];
  isLoaded;
  networkError;
  logger: Logger;

  constructor(
    private ws: WebserviceWrapperService,
    private loggingService: LoggingService
  ) {}

  ngOnInit() {
    this.getCourseData(this.course.courseId);
    this.logger = this.loggingService.getLogger("[/course-data.component]");
  }

  getCourseData(courseId) {
    this.isLoaded = false;
    this.networkError = false;
    this.ws
      .call(
        "pulsGetCourseData",
        { courseId: courseId },
        { forceRefreshGroup: this.refresh }
      )
      .subscribe(
        (response: IPulsAPIResponse_getCourseData) => {
          this.courseData = response;

          let i;
          this.courseGroups = [];
          // check how many different groups exist
          if (
            this.courseData &&
            this.courseData.courseData &&
            this.courseData.courseData.course
          ) {
            const coursetmp = convertToArray(
              this.courseData.courseData.course
            )[0];

            if (coursetmp && coursetmp.events && coursetmp.events.event) {
              const tmp = convertToArray(coursetmp.events.event);
              for (i = 0; i < tmp.length; i++) {
                if (
                  tmp[i].groupId &&
                  !isInArray(this.courseGroups, tmp[i].groupId)
                ) {
                  this.courseGroups.push(tmp[i].groupId);
                }
              }
            }
          }

          this.isLoaded = true;
        },
        (error) => {
          this.networkError = true;
          this.logger.error("getCourseData()", error);
        }
      );
  }

  /**
   * has to be declared for html pages to use the imported function
   * couldn't find a better solution
   * @param array
   */
  convertToArray(array) {
    return convertToArray(array);
  }

  /**
   * TODO: can be removed when bug in api is fixed
   * @name checkDoubledLecturers
   * @param event
   * @param lecturer
   * @param index
   */
  checkDoubledLecturers(event, lecturer, index) {
    if (event && event.eventId && lecturer && lecturer.lecturerId) {
      if (
        this.lecturerList[event.eventId] !== undefined &&
        this.lecturerList[event.eventId].length > 0
      ) {
        if (
          isInArray(
            this.lecturerList[event.eventId],
            [lecturer.lecturerId][index]
          )
        ) {
          return true;
        } else {
          let i;
          let alreadyIn = false;
          for (i = 0; i < this.lecturerList.length; i++) {
            if (
              this.lecturerList[i] !== undefined &&
              this.lecturerList[i][0] === lecturer.lecturerId
            ) {
              alreadyIn = true;
            }
          }

          if (alreadyIn) {
            return false;
          } else {
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
   * @name replaceUnderscore
   * @param {string} roomSc
   */
  replaceUnderscore(roomSc: string) {
    if (roomSc !== undefined) {
      return roomSc.replace(/_/g, ".");
    } else {
      return "";
    }
  }
}
