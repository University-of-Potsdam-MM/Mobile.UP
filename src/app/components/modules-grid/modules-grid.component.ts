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
    // this.options.maxRows = this.items.length / this.options.maxCols;
  }

  /**
   * input for the template to be used inside the gridsterItems.
   * Inside the template "module" will be available as context
   */
  @Input() template;

  items: GridsterItem[] = [];
  options: GridsterConfig;

  constructor() {
    this.options = {
      gridType: 'scrollVertical',
      compactType: 'compactLeft&Up',
      defaultItemCols: 1,
      defaultItemRows: 1,
      minRows: 1,
      maxRows: 5,
      minCols: 4,
      maxCols: 4,
      emptyCellDragMaxRows: 1,
      // kinda arbitrary
      mobileBreakpoint: 300,
      // delay after which dragging starts
      displayGrid: DisplayGrid.OnDragAndResize,
      draggable: {
        enabled: true
      },
      resizable: {
        enabled: false
      }
    };
  }

  ngOnInit() {

  }

}
