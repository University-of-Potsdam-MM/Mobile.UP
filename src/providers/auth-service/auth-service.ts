import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Token } from "../../library/interfaces";
import { AuthState } from '../../library/enums';

// Might want to rename this to SessionProvider, because this service
// provides more than just authentication, as it is now.

const token_endpoint = {
  // Using a proxy now as defined in ionic.config.json
  url: "http://localhost:8100/token"
}

/**
 * Credentials
 * 
 * this class defines credentials that are used for logging in
 */
export class Credentials {
  id:string;
  password:string;
}

/**
 * User
 * 
 * this class defines a simple User object that describes an user and
 * contains tokens necessary to gain access to services
 */
export class User {
  id: string;
  token: Token;
  password:string;
  constructor(
      id: string,
      token: Token,
      password: string) {

    this.password = password;
    this.id = id;
    this.token = token;
  }
}

/**
 * AuthServiceProvider
 * 
 * this services provides authentication functionalities. The class keeps an 
 * instanct of Token and User and can use them when necessary.
 */
@Injectable()
export class AuthServiceProvider {
  
  private authParameters;
  private currentUser:User;
  private isLoggedIn: boolean;

  constructor(public http: HttpClient) {
    this.currentUser = null;
    this.isLoggedIn = false;
    this.authParameters = require("../../assets/json/authentication.json");
  }

  /**
   * createHttpHeaders
   * 
   * Creates HttpHeaders used for sending POST requests
   * @returns HttpHeaders
   */
  private createHttpHeaders(): HttpHeaders{
    return new HttpHeaders()
      .append(
        this.authParameters.headers.authorization.name, 
        this.authParameters.headers.authorization.value
      ).append(
        this.authParameters.headers.contentType.name, 
        this.authParameters.headers.contentType.value
    );
  }

  /**
   * login
   * 
   * tries to login with provided credentials. Returns an Observable<AuthState>
   * giving information about the procedures result.
   * @param credentials:Credentials Credentials used for login
   * @returns Observable<AuthState> Information about result
   */
  public login(credentials: Credentials): Observable<AuthState> {

    // insert check for existing network connection and permissions
    // might implement a method that creates HttpParams from an object to reduce
    // duplicate code. Same code can be found in logout()

    var headers = this.createHttpHeaders();

    
    var params:HttpParams = new HttpParams()
      .append(
        this.authParameters.body.grant_type.name, 
        this.authParameters.body.grant_type.values.password
      ).append(
        this.authParameters.body.username.name, 
        credentials.id
      ).append(
        this.authParameters.body.password.name, 
        credentials.password
    );

    return Observable.create(observer => {
      
      this.http.post<Token>(token_endpoint.url, params, {headers: headers})
        .subscribe(
          token => {
            // We got a token, now we can create a user 
            this.currentUser = new User(credentials.id, token, credentials.password);
            
            observer.next(AuthState.OK);
            observer.complete();
            this.isLoggedIn = true;
          },
          error => {
            console.log(error);
            // We'll assume that the credentials are incorrect for now. Should
            // test for exact error and pass according AuthState value so the 
            // correct message can be shown in the alert
            observer.next(AuthState.CREDENTIALS);
            observer.complete();            
          }
        );
    });
  }

  /**
   * logout
   * 
   * performs a logout for the currently signed in user. Returns an 
   * Observable<boolean> showing success or failure.
   * @returns Observable<boolean>
   */
  public logout(): Observable<boolean> {
    // Check if user is logged in in the first place
    if (this.currentUser) {
      return Observable.create(observer => {
        // --> perform logout here
        this.currentUser = null;
        observer.next(true);
        observer.complete();
        this.isLoggedIn = false;        
      });
    } else {
      // show that user is not logged in anyway. Maybe unnecessary? Only give
      // logout option when logged in? Sounds good.
    }
  }

  /**
   * refreshToken
   * 
   * refreshes the current token with refresh_token. Returns an Observable that
   * will contain a boolean value signifying success or failure.
   * @returns Observable<boolean>
   */
  public refreshToken(): Observable<AuthState> {
    
    var headers:HttpHeaders = this.createHttpHeaders();

    var params:HttpParams = new HttpParams()
      .append(
        this.authParameters.body.grant_type.name, 
        this.authParameters.body.grant_type.values.refresh_token
      ).append(
        this.authParameters.body.refresh_token.name, 
        this.currentUser.token.refresh_token
    );

    return Observable.create(observer => {
      
      this.http.post<Token>(
        token_endpoint.url, params, {headers: headers}
      ).subscribe(
        token => {
          this.currentUser.token = token;
          observer.next(AuthState.OK);
          observer.complete();
        },
        error => {
          // Don't know what could go wrong here, so I'll just leave OTHER here
          // Ought to be refactored
          observer.next(AuthState.OTHER);
          observer.complete();          
          console.error(error)
        }
      );
    });
  }

  /**
   * getAccessToken
   * 
   * exposes current accessToken to the outside
   */
  public getAccessToken(): string {
    if (this.isLoggedIn) {
      return this.currentUser.token.access_token;
    }
  }

  /**
   * getUserInfo
   * 
   * returns current User
   */
  public getUserInfo():User {
    return this.currentUser;
  }
  

  /* not implemented yet */

  public apiManagerLogin(){
  
  }

  public apiManagerRefresh(){

  }

  public oAuthLogin(){

  }

  public oAuthRefresh(){

  }

}
