import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({
  name: 'moment',
})
export class MomentPipe implements PipeTransform {

  transform(string, format) {
    return moment(string, 'HH:mm:ss').format(format);
  }
}
