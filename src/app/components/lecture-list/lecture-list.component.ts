import { Component, OnInit, Input } from "@angular/core";
import {
  IPulsAPIResponse_getLectureScheduleRoot,
  IPulsAPIResponse_getLectureScheduleSubTree,
  IPulsAPIResponse_getLectureScheduleCourses,
} from "src/app/lib/interfaces_PULS";
import { utils } from "src/app/lib/util";
import { WebserviceWrapperService } from "../../services/webservice-wrapper/webservice-wrapper.service";

@Component({
  selector: "app-lecture-list",
  templateUrl: "./lecture-list.component.html",
  styleUrls: ["./lecture-list.component.scss"],
})
export class LectureListComponent implements OnInit {
  @Input() headerIdInput: string;
  @Input() hasSubTreeInput;
  headerId: string;
  hasSubTree;
  @Input() refresh = false;

  lectureSchedule;
  isLoaded;
  networkError;
  isExpanded = [];
  isExpandedCourse = [];

  constructor(private ws: WebserviceWrapperService) {}

  ngOnInit() {
    if (this.headerIdInput) {
      this.headerId = this.headerIdInput;
    }
    if (this.hasSubTreeInput) {
      this.hasSubTree = true;
    }
    this.isLoaded = false;
    this.networkError = false;

    if (!this.headerId) {
      this.ws
        .call(
          "pulsGetLectureScheduleRoot",
          {},
          { forceRefreshGroup: this.refresh }
        )
        .subscribe(
          (response: IPulsAPIResponse_getLectureScheduleRoot) => {
            this.lectureSchedule = response;
            this.isLoaded = true;
          },
          (error) => {
            this.networkError = true;
          }
        );
    } else if (this.hasSubTree) {
      this.ws
        .call(
          "pulsGetLectureScheduleSubTree",
          { headerId: this.headerId },
          { forceRefreshGroup: this.refresh }
        )
        .subscribe(
          (response: IPulsAPIResponse_getLectureScheduleSubTree) => {
            this.lectureSchedule = response;
            this.isLoaded = true;
          },
          (error) => {
            this.networkError = true;
          }
        );
    } else {
      this.ws
        .call(
          "pulsGetLectureScheduleCourses",
          { headerId: this.headerId },
          { forceRefreshGroup: this.refresh }
        )
        .subscribe(
          (response: IPulsAPIResponse_getLectureScheduleCourses) => {
            this.lectureSchedule = response;
            this.isLoaded = true;
          },
          (error) => {
            this.networkError = true;
          }
        );
    }
  }

  /**
   * @name expandChild
   * @param childNode
   */
  expandChild(childNode): void {
    if (childNode.subNodes) {
      if (Number(childNode.subNodes.count) > 0) {
        this.hasSubTree = true;
      } else {
        this.hasSubTree = false;
      }
    } else {
      this.hasSubTree = false;
    }

    if (childNode.headerId) {
      this.headerId = childNode.headerId;

      if (this.isExpanded[childNode.headerId]) {
        this.isExpanded[childNode.headerId] = false;
      } else {
        this.isExpanded[childNode.headerId] = true;
      }
    }
  }

  /**
   * @name expandCourse
   * @param course
   */
  expandCourse(course): void {
    if (course.courseId) {
      const courseId = course.courseId;

      if (this.isExpandedCourse[courseId]) {
        this.isExpandedCourse[courseId] = false;
      } else {
        this.isExpandedCourse[courseId] = true;
      }
    }
  }

  /**
   * @name htmlDecode
   * @param input
   */
  htmlDecode(input) {
    const doc = new DOMParser().parseFromString(input, "text/html");
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
