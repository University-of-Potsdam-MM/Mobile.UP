import { HttpParameterCodec } from "@angular/common/http";

/**
 * A `HttpParameterCodec` that uses `encodeURIComponent` and `decodeURIComponent` to
 * serialize and parse URL parameter keys and values.
 *
 * see https://github.com/angular/angular/issues/11058
 */
export class WebHttpUrlEncodingCodec implements HttpParameterCodec {
  encodeKey(k: string): string { return encodeURIComponent(k); }
  encodeValue(v: string): string { return encodeURIComponent(v); }
  decodeKey(k: string): string { return decodeURIComponent(k); }
  decodeValue(v: string) { return decodeURIComponent(v); }
}

export module utils {


  /**
   * @name isInArray
   * @description checks if value is in array
   * @param {Array} array
   * @param {any} value
   * @returns {boolean} whether value in array
   */
  export function isInArray(array, value): boolean {
    var i;
    var found = false;
    for (i = 0; i < array.length; i++) {
      if (array[i] == value) {
        found = true;
      }
    }
    return found;
  }

  export function convertToArray(toConvert) { // convert everything to an array so you can handle it universally
    if (Array.isArray(toConvert)) {
      return toConvert;
    } else {
      var tmp = [];
      tmp.push(toConvert);
      return tmp;
    }
  }

}