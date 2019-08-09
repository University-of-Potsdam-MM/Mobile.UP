import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', loadChildren: './pages/home/home.module#HomePageModule' },
  { path: 'app-info', loadChildren: './pages/app-info/app-info.module#AppInfoPageModule' },
  { path: 'campus-map', loadChildren: './pages/campus-map/campus-map.module#CampusMapPageModule' },
  { path: 'emergency', loadChildren: './pages/emergency/emergency.module#EmergencyPageModule' },
  { path: 'events', loadChildren: './pages/events/events.module#EventsPageModule' },
  { path: 'grades', loadChildren: './pages/grades/grades.module#GradesPageModule' },
  { path: 'impressum', loadChildren: './pages/impressum/impressum.module#ImpressumPageModule' },
  { path: 'lectures', loadChildren: './pages/lectures/lectures.module#LecturesPageModule' },
  { path: 'library-search', loadChildren: './pages/library-search/library-search.module#LibrarySearchPageModule' },
  { path: 'login', loadChildren: './pages/login/login.module#LoginPageModule' },
  { path: 'mensa', loadChildren: './pages/mensa/mensa.module#MensaPageModule' },
  { path: 'news', loadChildren: './pages/news/news.module#NewsPageModule' },
  { path: 'opening-hours', loadChildren: './pages/opening-hours/opening-hours.module#OpeningHoursPageModule' },
  { path: 'person-search', loadChildren: './pages/person-search/person-search.module#PersonSearchPageModule' },
  { path: 'practice', loadChildren: './pages/practice/practice.module#PracticePageModule' },
  { path: 'roomplan', loadChildren: './pages/roomplan/roomplan.module#RoomplanPageModule' },
  { path: 'free-rooms', loadChildren: './pages/free-rooms/free-rooms.module#FreeRoomsPageModule' },
  { path: 'settings', loadChildren: './pages/settings/settings.module#SettingsPageModule' },
  { path: 'timetable', loadChildren: './pages/timetable/timetable.module#TimetablePageModule' },
  { path: 'transport', loadChildren: './pages/transport/transport.module#TransportPageModule' },
  { path: 'feedback', loadChildren: './pages/feedback/feedback.module#FeedbackPageModule' },
  { path: 'library-account', loadChildren: './pages/library-account/library-account.module#LibraryAccountPageModule' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
