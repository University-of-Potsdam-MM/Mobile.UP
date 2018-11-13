import { Component, Input } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Storage } from '@ionic/storage';
import { IConfig } from '../../library/interfaces';

@Component({
  selector: 'lecture-list',
  templateUrl: 'lecture-list.html'
})
export class LectureListComponent {

  @Input() headerIdInput:string;
  @Input() hasSubTreeInput;
  headerId:string;
  hasSubTree;

  authToken;
  endpointUrl;

  lectureSchedule;
  isExpanded = [];
  isExpandedCourse = [];

  constructor(private http: HttpClient, private storage: Storage) {
  }

  ngOnInit() {
    this.storage.get("config").then((config:IConfig) => {
      this.authToken = config.webservices.apiToken;
      this.endpointUrl = config.webservices.endpoint.puls;
      this.getLectureData();
    });
  }

  getLectureData() {

    if (this.headerIdInput) {
      this.headerId = this.headerIdInput;
    }

    if (this.hasSubTreeInput) {
      this.hasSubTree = true;
    }

    let headers = new HttpHeaders()
      .append("Authorization", this.authToken);

    if (!this.headerId) {
      let url = this.endpointUrl + "getLectureScheduleRoot";

      this.http.post(url, {"condition":{"semester":0}}, {headers:headers}).subscribe(data => {
        console.log(data);
        this.lectureSchedule = data;

      });
    } else if (this.hasSubTree) {
      let url = this.endpointUrl + "getLectureScheduleSubTree";

      this.http.post(url, {"condition":{"headerId":this.headerId}}, {headers:headers}).subscribe(data => {
        console.log(data);
        this.lectureSchedule = data;
      });
    } else {
      let url = this.endpointUrl + "getLectureScheduleCourses";

      this.http.post(url, {"condition":{"headerId":this.headerId}}, {headers:headers}).subscribe(data => {
        console.log(data);
        this.lectureSchedule = data;
      });
    }
  }

  expandChild(childNode) {

    console.log(childNode);

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
    console.log(course);

    if (course.courseId) {
      let courseId = course.courseId;
      
      if (this.isExpandedCourse[courseId]) {
        this.isExpandedCourse[courseId] = false;
      } else { this.isExpandedCourse[courseId] = true; }
    }
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

  htmlDecode(input) {
    var doc = new DOMParser().parseFromString(input, "text/html");
    return doc.documentElement.textContent;
  }

}
