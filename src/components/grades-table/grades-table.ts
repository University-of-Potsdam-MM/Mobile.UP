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
  achievements;

  constructor() {
  }

  ngOnInit() {
    this.currentProfession = "0";
    this.achievements = this.studentGrades.academicAchievements.achievement.field;
  }

  log() {
    console.log(this.currentProfession);
  }

}
