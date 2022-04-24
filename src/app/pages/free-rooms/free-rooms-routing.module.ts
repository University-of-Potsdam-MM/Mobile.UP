import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FreeRoomsPage } from './free-rooms.page';

const routes: Routes = [
  {
    path: '',
    component: FreeRoomsPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FreeRoomsPageRoutingModule {}
