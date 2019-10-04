import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {DisplayGrid, GridsterComponent, GridsterConfig, GridsterItem} from 'angular-gridster2';
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

  constructor() {
    this.options = {
      gridType: 'scrollVertical',
      compactType: 'compactUp&Left',
      // default size of a tile
      defaultItemCols: 1,
      defaultItemRows: 1,
      // minimum/maximum dimensions of grid
      minRows: 1,
      maxRows: 4,
      minCols: 4,
      maxCols: 4,
      // tiles cannot be dragged further than 0 (?) tiles away
      emptyCellDragMaxRows: 0,
      // kinda arbitrary
      mobileBreakpoint: 300,
      // show grid-lines when dragging
      displayGrid: DisplayGrid.OnDragAndResize,
      draggable: {
        // delay after which dragging starts
        delayStart: 250,
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
