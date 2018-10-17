import { Component, Input } from '@angular/core';

@Component({
  selector: 'grades-table',
  templateUrl: 'grades-table.html'
})
export class GradesTableComponent {

  @Input() studentGrades;
  @Input() isDualDegree;
  @Input() i;

  currentProfession = "0";
  gradeArray = [];

  constructor() {
  }

  ngOnInit() {
    this.currentProfession = "0";
    let achievements = this.studentGrades.academicAchievements.achievement.field;
    if (Array.isArray(achievements)) {
      this.gradeArray = achievements;
    } else { this.gradeArray.push(achievements); }
    console.log(this.gradeArray);
  }

}
