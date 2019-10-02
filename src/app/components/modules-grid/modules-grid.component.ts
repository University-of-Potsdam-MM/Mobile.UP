import {Component, Input, OnInit} from '@angular/core';
import {DisplayGrid, GridsterConfig, GridsterItem} from 'angular-gridster2';
import {IModule} from '../../lib/interfaces';

@Component({
  selector: 'modules-grid',
  templateUrl: './modules-grid.component.html',
  styleUrls: ['./modules-grid.component.scss'],
})
export class ModulesGridComponent implements OnInit {

  /**
   * converts passed modules list to gridsterItems
   * @param modules
   */
  @Input() set modules(modules: IModule[]) {
    this.items = modules.map(
      m => {
        return {
          x: undefined,
          y: undefined,
          rows: 1,
          cols: 1,
          module: m
        };
      }
    );
  }

  /**
   * input for the template to be used inside the gridsterItems.
   * Inside the template "module" will be available as context
   */
  @Input() template;

  items: GridsterItem[] = [];
  options: GridsterConfig;

  constructor() {}

  ngOnInit() {
    this.options = {
      gridType: 'fit',
      compactType: 'compactLeft&Up',
      defaultItemCols: 1,
      defaultItemRows: 1,
      minRows: 1,
      maxRows: 10,
      minCols: 4,
      maxCols: 4,
      mobileBreakpoint: 1,
      displayGrid: DisplayGrid.None,
      delayStart: 10,
      draggable: {
        enabled: true
      },
      resizable: {
        enabled: false
      }
    };
  }

}
