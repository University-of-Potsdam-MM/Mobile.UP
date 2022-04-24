import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RoomplanPage } from './roomplan.page';

const routes: Routes = [
  {
    path: '',
    component: RoomplanPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RoomplanPageRoutingModule {}
