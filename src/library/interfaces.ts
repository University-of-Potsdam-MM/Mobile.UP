/* ~~~ EmergencyPage ~~~ */

/**
 * Interface for a contact with telephone number and email address
 */
export interface Contact {
    telephone:  string;
    mail?:      string;
}

/**
 * Interface for an address consisting og postal zip code and street
 */
export interface Address {
    postal:     string;
    street:     string;
}

/**
 * Interface for a single EmergencyCall entry
 * An EmergencyCall always has a 'name:string' and a 'telephone:string', any
 * other attribute is optional.
 */
export interface EmergencyCall {
    name:       string,
    contact:    Contact,
    address?:   Address
}


/* ~~~ PersonsPage ~~~ */

export interface IPersonSearchResponse {
  timer:Array<string>;
  people:IPersonWrapper[];
}

export interface IPersonWrapper {
  Person:IPerson
}

export interface IPerson {
  id?:string;
  Abteilung?:string;
  Email?:string;
  Fax?:number,
  Nachname?:string;
  Namenszusatz?:string;
  Raum?:string;
  show_only_altPhone?:string;
  Struktureinheiten?:string;
  Suchbegriffe?:string;
  Telefon?:string;
  Vorname?:string;
  zweitesTelefon?:string;
  PCFax?:string;
  gueltigbis?:string;
  Titel?:string;
  Email_Langform?:string;
}
