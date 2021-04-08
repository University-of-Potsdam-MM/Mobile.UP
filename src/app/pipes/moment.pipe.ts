import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({
  name: 'moment',
})
export class MomentPipe implements PipeTransform {
  transform(str, format) {
    return moment(str, 'HH:mm:ss').format(format);
  }
}
