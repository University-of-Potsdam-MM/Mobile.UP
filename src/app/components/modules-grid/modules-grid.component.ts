import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  OnInit,
} from '@angular/core';
import {
  DisplayGrid,
  GridsterComponent,
  GridsterConfig,
  GridsterItem,
} from 'angular-gridster2';
import { IModule } from '../../lib/interfaces';
import { Platform, MenuController } from '@ionic/angular';
import * as dLoop from 'delayed-loop';

/**
 * This components takes a list of modules and displays those modules as tiles.
 * modules with 'selected=false' will not be displayed. When some tile of the grid
 * has been modified this component will emit a 'gridChanged' signal.
 */
@Component({
  selector: 'modules-grid',
  templateUrl: './modules-grid.component.html',
  styleUrls: ['./modules-grid.component.scss'],
})
export class ModulesGridComponent implements OnInit {
  @ViewChild(GridsterComponent, { static: false }) gridster: GridsterComponent;

  /**
   * converts passed modules list to gridsterItems
   *
   * @param modulesList
   */
  @Input() modules: IModule[];

  /**
   * input for the template to be used inside the gridsterItems.
   * Inside the template "module" will be available as context
   */
  @Input() template;

  @Output() editingModeChanged: EventEmitter<void> = new EventEmitter<void>();

  /**
   * emits a signal, when the grid has changed
   */
  @Output() gridChanged: EventEmitter<void> = new EventEmitter<void>();

  options: GridsterConfig;
  editingMode = false;
  gridsterWrapperHeight: number;

  constructor(private platform: Platform, private menuCtrl: MenuController) {}

  ngOnInit() {
    this.subscribeToResizeEvent();
    this.setupGridOptions();
  }

  // listen to resize event on browser, so that the grid can resize
  // depending on window width
  subscribeToResizeEvent() {
    if (!(this.platform.is('ios') || this.platform.is('android'))) {
      this.platform.resize.subscribe(() => {
        this.onWindowResize();
      });
    }
  }

  setupGridOptions() {
    this.options = {
      gridType: 'scrollVertical',
      // makes the tiles float upwards first then to the left
      compactType: 'compactUp&Left',
      // default size of a tile
      defaultItemCols: 1,
      defaultItemRows: 1,
      // minimum/maximum dimensions of grid
      minRows: 0,
      minCols: Math.floor(this.platform.width() / 120),
      maxCols: Math.floor(this.platform.width() / 120),
      disableScrollHorizontal: true,
      disableScrollVertical: true,
      // tiles cannot be dragged further than 0 (?) tiles away
      emptyCellDragMaxRows: 0,
      // this defines the boundary at which gridster breaks the tiled layout
      // and just stacks the tiles in one column. We don't want that in any case,
      // so we use a value that won't be reached by any device
      mobileBreakpoint: 1,
      // show grid-lines when dragging
      displayGrid: DisplayGrid.OnDragAndResize,
      draggable: {
        // delay after which dragging starts, also arbitrary. There might be a
        // better value
        delayStart: 250,
        enabled: false,
      },
      resizable: {
        enabled: false,
      },
      // we don't really care about what actually happened. It's sufficient to tell
      // the page using this component that the modules have been altered
      itemChangeCallback: (_, itm) => {
        if (
          itm &&
          itm.$item &&
          this.gridster.getNextPossiblePosition(itm.$item)
        ) {
          itm.item.x = itm.$item.x;
          itm.item.y = itm.$item.y;
          this.resizeWrapper();
        }
        this.gridChanged.emit();
      },
      // here we also want the wrapper to resize because the grid dimensions may
      // have changed
      itemInitCallback: () => {
        this.onWindowResize();
      },
      // here we do care about the items position, though
      // position needs to be reset to avoid conflicts that arise when we do:
      //   1. remove module
      //   2. select some other module
      //   3. add removed module again
      // in this scenario both modules would have the same position, which annoys
      // gridster a bit.
      itemRemovedCallback: (item: GridsterItem) => {
        item.x = undefined;
        item.y = undefined;
        this.onWindowResize();
      },
      gridSizeChangedCallback: () => {
        this.resizeWrapper();
      },
    };
  }

  /**
   * Resizes the div wrapping the grid. This needs to be done, because gridster
   * does not resize itself.
   */
  resizeWrapper() {
    this.gridsterWrapperHeight =
      this.gridster.curRowHeight * this.gridster.rows;
  }

  toggleEditingMode() {
    this.editingMode = !this.editingMode;
    this.options.draggable.enabled = !this.options.draggable.enabled;
    this.options.api.optionsChanged();
    this.menuCtrl.enable(!this.editingMode);
    this.editingModeChanged.emit();
  }

  setColumnSizeForScreenWidth() {
    const newColumnSize = Math.floor(this.platform.width() / 120);
    this.options.minCols = newColumnSize;
    this.options.maxCols = newColumnSize;
    this.options.api.optionsChanged();
  }

  onWindowResize() {
    // uses available screen width to determine grid size
    this.setColumnSizeForScreenWidth();

    // sort favorites by coordinates in grid
    // from upper left corner to bottom right
    if (this.gridster && this.gridster.grid) {
      this.gridster.grid.sort((a, b) => {
        if (a.$item.y < b.$item.y) {
          return -1;
        } else if (b.$item.y < a.$item.y) {
          return 1;
        } else if (a.$item.x < b.$item.x) {
          return -1;
        } else if (b.$item.x < a.$item.x) {
          return 1;
        } else {
          return 0;
        }
      });

      // set new x-y-coordinates depending on index and grid-size
      const loop = dLoop(this.gridster.grid, (itm, idx, fin) => {
        if (itm && itm.$item && itm.item) {
          itm.$item.x = idx % this.gridster.options.maxCols;
          itm.$item.y = Math.floor(idx / this.gridster.options.maxCols);
          itm.item.x = itm.$item.x;
          itm.item.y = itm.$item.y;
        }
        fin();
      });

      // once all item coordinates are updated,
      // resize wrapper to fit new grid size
      loop.then(() => {
        this.resizeWrapper();
        setTimeout(() => {
          this.resizeWrapper();
        }, 250);
        this.gridChanged.emit();
      });
    } else {
      this.resizeWrapper();
      this.gridChanged.emit();
    }
  }
}
