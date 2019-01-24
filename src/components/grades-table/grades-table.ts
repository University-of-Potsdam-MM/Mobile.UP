import { Component, Input } from '@angular/core';

@Component({
  selector: 'grades-table',
  templateUrl: 'grades-table.html'
})
export class GradesTableComponent {

  @Input() studentGrades;
  @Input() studentDetails;
  @Input() isDualDegree;
  @Input() i;

  currentProfession = "0";
  gradeArray = [];

  constructor() {
  }

  ngOnInit() {
    this.currentProfession = "0";
    if (this.studentGrades.academicAchievements && this.studentGrades.academicAchievements.achievement && this.studentGrades.academicAchievements.achievement.field) {
      this.gradeArray = this.convertToArray(this.studentGrades.academicAchievements.achievement.field);
    }
    console.log(this.gradeArray);
  }

  isArray(toCheck) {
    if (Array.isArray(toCheck)) {
      return true;
    } else { return false; }
  }

  convertToArray(toConvert) { // convert everything to an array so you can handle it universally 
    if (this.isArray(toConvert)) {
      return toConvert;
    } else {
      var tmp = [];
      tmp.push(toConvert);
      return tmp;
    }
  }

  unescapeHTML(s:string) { // replaces &colon; in strings, unescape / decodeURI didnt work (?)
    return s.replace(/&colon;/g, ":");
  }

}
