import {Component, Input, OnInit} from '@angular/core';
import {DisplayGrid, GridsterConfig} from 'angular-gridster2';

@Component({
  selector: 'modules-grid',
  templateUrl: './modules-grid.component.html',
  styleUrls: ['./modules-grid.component.scss'],
})
export class ModulesGridComponent implements OnInit {

  @Input() modules;
  @Input() template;

  options: GridsterConfig;

  constructor() {}

  ngOnInit() {
    this.options = {
      compactType: 'compactLeft&Up',
      defaultItemCols: 1,
      defaultItemRows: 1,
      displayGrid: DisplayGrid.Always,
      delayStart: 10,
      minCols: 4,
      maxCols: 4,
      minRows: 4,
      maxRows: 4,
      draggable: {
        enabled: true
      },
      resizable: {
        enabled: false
      },
      gridType: 'fit'
    };
  }

}
