import { Component, Input } from '@angular/core';
import { utils } from '../../library/util';

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
      this.gradeArray = utils.convertToArray(this.studentGrades.academicAchievements.achievement.field);
    }
  }

  isArray(toCheck) {
    if (Array.isArray(toCheck)) {
      return true;
    } else { return false; }
  }

  /**
   * has to be declared for html pages to use the imported function
   * couldn't find a better solution
   * @param array 
   */
  convertToArray(array) {
    return utils.convertToArray(array)
  }

  unescapeHTML(s:string) { // replaces &colon; in strings, unescape / decodeURI didnt work (?)
    return s.replace(/&colon;/g, ":");
  }

}
