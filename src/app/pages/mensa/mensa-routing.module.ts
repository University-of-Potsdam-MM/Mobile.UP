import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MensaPage } from './mensa.page';

const routes: Routes = [
  {
    path: '',
    component: MensaPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MensaPageRoutingModule {}
