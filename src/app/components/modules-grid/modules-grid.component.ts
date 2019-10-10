import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {DisplayGrid, GridsterComponent, GridsterConfig, GridsterItem, GridsterItemComponentInterface} from 'angular-gridster2';
import {IModule} from '../../lib/interfaces';
import {GridsterResizeEventType} from 'angular-gridster2/lib/gridsterResizeEventType.interface';

@Component({
  selector: 'modules-grid',
  templateUrl: './modules-grid.component.html',
  styleUrls: ['./modules-grid.component.scss'],
})
export class ModulesGridComponent {

  @ViewChild(GridsterComponent) gridster: GridsterComponent;

  /**
   * converts passed modules list to gridsterItems
   * @param modulesList
   */
  @Input() set modules(modulesList: IModule[]) {
    this.items = modulesList;
  }

  @Output() gridChanged: EventEmitter<void> = new EventEmitter<void>();

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
      },
      itemChangeCallback: (item: GridsterItem, itemComponent: GridsterItemComponentInterface) => {
        this.gridChanged.emit();
      },
      itemInitCallback: (item: GridsterItem, itemComponent: GridsterItemComponentInterface) => {
        this.gridChanged.emit();
      },
      itemRemovedCallback: (item: GridsterItem, itemComponent: GridsterItemComponentInterface) => {
        // position needs to be reset to avoid conflicts when
        //  1. remove module
        //  2. select some other module
        //  3. add removed module again
        // in this scenario both modules would have the same position, which annoys
        // gridster a bit.
        item.x = undefined;
        item.y = undefined;
        this.gridChanged.emit();
      }
    };
  }
}
