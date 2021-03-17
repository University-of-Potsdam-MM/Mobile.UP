import { Component, OnInit, ViewChild } from '@angular/core';
import { WebserviceWrapperService } from 'src/app/services/webservice-wrapper/webservice-wrapper.service';
import { AbstractPage } from 'src/app/lib/abstract-page';
import { IEventApiResponse, INewsEventsObject } from 'src/app/lib/interfaces';
import { IonSlides } from '@ionic/angular';
import { ConfigService } from 'src/app/services/config/config.service';

@Component({
  selector: 'app-events',
  templateUrl: './events.page.html',
  styleUrls: ['./events.page.scss'],
})
export class EventsPage extends AbstractPage implements OnInit {
  @ViewChild(IonSlides, { static: false }) slides: IonSlides;

  isLoaded;
  networkError;

  listOfPlaces = [];
  listOfEvents: INewsEventsObject[] = [];

  showLeftButton = false;
  showRightButton = true;
  selectedPlace = 0;

  slideOptions = {
    slidesPerView: 'auto',
  };

  constructor(private ws: WebserviceWrapperService) {
    super({ optionalNetwork: true });
  }

  ngOnInit() {
    this.loadEvents();
  }

  loadEvents(refresher?) {
    if (!(refresher && refresher.target)) {
      this.isLoaded = false;
    }
    this.networkError = false;

    this.ws
      .call('events', {}, { forceRefresh: refresher !== undefined })
      .subscribe(
        (response: IEventApiResponse) => {
          if (refresher && refresher.target) {
            refresher.target.complete();
          }

          if (
            response.errors === undefined ||
            response.errors.exist === false
          ) {
            if (response.vars && response.vars.events) {
              // check if the events is already outdated since the api returns old events
              this.listOfEvents = response.vars.events;

              this.listOfEvents.sort(
                (a, b) => Number(a.Event.startTime) - Number(b.Event.startTime)
              );
            } else {
              this.listOfEvents = [];
            }

            this.listOfPlaces = [];
            if (response.vars && response.vars.places) {
              const tmpArray = [];
              // eslint-disable-next-line guard-for-in
              for (const place in response.vars.places) {
                tmpArray.push(response.vars.places[place]);
              }

              // only add places to the list, that actually have corresponding events
              for (const tmp of tmpArray) {
                for (const event of this.listOfEvents) {
                  if (tmp === event.Place.name) {
                    this.listOfPlaces.push(tmp);
                    break;
                  }
                }
              }
            }

            this.isLoaded = true;

            if (this.slides) {
              this.slides.update();
            }

            if (this.selectedPlace === 0) {
              this.showLeftButton = false;
            }
          }
        },
        () => {
          this.isLoaded = true;
          if (refresher && refresher.target) {
            refresher.target.complete();
          }
          this.networkError = true;
        }
      );
  }

  // Method executed when the slides are changed
  async slideChanged() {
    this.showLeftButton = !(await this.slides.isBeginning());
    this.showRightButton = !(await this.slides.isEnd());
  }

  // Method that shows the next slide
  slideNext(): void {
    this.slides.slideNext();
    this.slideChanged();
  }

  // Method that shows the previous slide
  slidePrev(): void {
    this.slides.slidePrev();
    this.slideChanged();
  }

  setPlace(i: number): void {
    // this.newsSource = i;
    this.selectedPlace = i;
  }

  swipeListOfPlaces(event) {
    if (Math.abs(event.deltaY) < 50) {
      const maxIndex = this.listOfPlaces.length - 1;
      const currentIndex = this.selectedPlace;
      let newIndex;
      if (event.deltaX > 0) {
        // user swiped from left to right
        if (currentIndex > 0) {
          newIndex = currentIndex - 1;
          this.setPlace(newIndex);
          this.slides.slidePrev();
          this.slideChanged();
        }
      } else if (event.deltaX < 0) {
        // user swiped from right to left
        if (currentIndex < maxIndex) {
          newIndex = currentIndex + 1;
          this.setPlace(newIndex);
          this.slides.slideNext();
          this.slideChanged();
        }
      }
    }
  }

  openEventWebsite() {
    this.webIntent.permissionPromptWebsite(
      ConfigService.config.modules.events.additionalUrl
    );
  }
}
