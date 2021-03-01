import { Component, OnInit, Input } from "@angular/core";
import { convertToArray } from "src/app/lib/util";

@Component({
  selector: "app-grades-table",
  templateUrl: "./grades-table.component.html",
  styleUrls: ["./grades-table.component.scss"],
})
export class GradesTableComponent implements OnInit {
  currentProfession = "0";
  gradeArray = [];
  thesis;
  graduation;

  @Input() studentGrades;
  @Input() studentDetails;
  @Input() isDualDegree;
  @Input() i;

  constructor() {}

  ngOnInit() {
    this.currentProfession = "0";
    if (this.studentGrades && this.studentGrades.academicAchievements) {
      this.thesis = this.studentGrades.academicAchievements.thesis;
      this.graduation = this.studentGrades.academicAchievements.graduation;

      if (
        this.studentGrades.academicAchievements.achievement &&
        this.studentGrades.academicAchievements.achievement.field
      ) {
        this.gradeArray = convertToArray(
          this.studentGrades.academicAchievements.achievement.field
        );
      }
    }
  }

  changeProfession(event) {
    this.currentProfession = event.detail.value;
  }

  isArray(toCheck) {
    if (Array.isArray(toCheck)) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * has to be declared for html pages to use the imported function
   * couldn't find a better solution
   * @param array
   */
  convertToArray(array) {
    return convertToArray(array);
  }

  unescapeHTML(s: string) {
    // replaces &colon; in strings, unescape / decodeURI didnt work (?)
    if (s !== undefined) {
      return s.replace(/&colon;/g, ":");
    } else {
      return "";
    }
  }
}
