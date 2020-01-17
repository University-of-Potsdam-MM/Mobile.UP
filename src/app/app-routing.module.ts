import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', loadChildren: () => import('./pages/home/home.module').then(m => m.HomePageModule) },
  { path: 'app-info', loadChildren: () => import('./pages/app-info/app-info.module').then(m => m.AppInfoPageModule) },
  { path: 'campus-map', loadChildren: () => import('./pages/campus-map/campus-map.module').then(m => m.CampusMapPageModule) },
  { path: 'emergency', loadChildren: () => import('./pages/emergency/emergency.module').then(m => m.EmergencyPageModule) },
  { path: 'grades', loadChildren: () => import('./pages/grades/grades.module').then(m => m.GradesPageModule) },
  { path: 'impressum', loadChildren: () => import('./pages/impressum/impressum.module').then(m => m.ImpressumPageModule) },
  { path: 'lectures', loadChildren: () => import('./pages/lectures/lectures.module').then(m => m.LecturesPageModule) },
  { path: 'library-search', loadChildren: () => import('./pages/library-search/library-search.module').then(m => m.LibrarySearchPageModule) },
  { path: 'login', loadChildren: () => import('./pages/login/login.module').then(m => m.LoginPageModule) },
  { path: 'mensa', loadChildren: () => import('./pages/mensa/mensa.module').then(m => m.MensaPageModule) },
  { path: 'news', loadChildren: () => import('./pages/news/news.module').then(m => m.NewsPageModule) },
  { path: 'opening-hours', loadChildren: () => import('./pages/opening-hours/opening-hours.module').then(m => m.OpeningHoursPageModule) },
  { path: 'person-search', loadChildren: () => import('./pages/person-search/person-search.module').then(m => m.PersonSearchPageModule) },
  { path: 'practice', loadChildren: () => import('./pages/practice/practice.module').then(m => m.PracticePageModule) },
  { path: 'roomplan', loadChildren: () => import('./pages/roomplan/roomplan.module').then(m => m.RoomplanPageModule) },
  { path: 'free-rooms', loadChildren: () => import('./pages/free-rooms/free-rooms.module').then(m => m.FreeRoomsPageModule) },
  { path: 'settings', loadChildren: () => import('./pages/settings/settings.module').then(m => m.SettingsPageModule) },
  { path: 'timetable', loadChildren: () => import('./pages/timetable/timetable.module').then(m => m.TimetablePageModule) },
  { path: 'transport', loadChildren: () => import('./pages/transport/transport.module').then(m => m.TransportPageModule) },
  { path: 'feedback', loadChildren: () => import('./pages/feedback/feedback.module').then(m => m.FeedbackPageModule) }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
