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

/* ~~~ auth-service ~~~ */

/* Login and Authentification */

/**
 * Interface for a Token that a User class can possess
 */
export interface Token {
    access_token:   string;
    refresh_token:  string;
    scope:          string;
    token_type:     string;
    expires_in:     number;
    id_token?:      string;
}