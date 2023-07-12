import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HTTP_INTERCEPTORS,
  HttpErrorResponse,
  HttpResponse
} from '@angular/common/http';
import { catchError, mergeMap, Observable, of, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonService } from '../services/common.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  blnIsRefreshing = false;
  blnIsLoggingOut = false;

  constructor(
    private objAuthService: AuthService,
    private objNgbModal: NgbModal,
    private objCommonService: CommonService
  ) { }

  intercept(objRequest: HttpRequest<any>, objNext: HttpHandler): Observable<HttpEvent<any>> {
    // If there is a valid access token, add it to the request headers
    objRequest = this.addToken(objRequest, this.objAuthService.getAccessToken());

    // Pass the request to the next handler and mergeMap the response
    return objNext.handle(objRequest).pipe(
      mergeMap((objResponse: HttpEvent<any>) => {
        // If the response is error due to NO_PRILVAGES handles the workspace switch 
        if (objResponse instanceof HttpResponse && objResponse.body?.errors && objResponse.body?.errors[0].error_code === "NO_PRIVILEGES") {
          return this.handleWrokspaceSwitch(objRequest, objNext)
        } else {
          return of(objResponse);
        }
      }),
      catchError((objError: any) => {
        if (objError instanceof HttpErrorResponse && objError.status == 401 && !objRequest.url.includes('logout') && !objRequest.url.includes('login')) {
          return this.handle401Unauthoized()
        } else{
          // If there is an error, handle it here
          return throwError(() => new Error(objError))
        }
          
      })
    );
  }

  /**
   * Add headers to the requests
   * @param objRequest clone of the request
   * @param access_token Access token fetched form localstorage
   * @returns modified request by adding sufficient headers
   */
  private addToken(objRequest: HttpRequest<any>, access_token: string | null): HttpRequest<any> {
    if (objRequest.url.includes('/login')) {
      // Do not add the access token to these specific routes
      return objRequest.clone({ setHeaders: { 'Content-Type': `application/json; charset=utf-8`, } })
    } else {
      // Add the access token to all other routes
      return objRequest.clone({
        setHeaders: { 'Content-Type': `application/json; charset=utf-8`, 'Authorization': `Bearer ${access_token}` }
      })
    }
  }

  /**
   * Handle the error NO_PRIVILEGES occured while switching hexabase workspace from hexabase UI
   * @param objRequest Clone of request in which error occurs
   * @param objNext next handler
   * @returns returns the next request to be processed
   */
  private handleWrokspaceSwitch(
    objRequest: HttpRequest<any>, // HTTP request object
    objNext: HttpHandler // HTTP request handler
  ): Observable<HttpEvent<any>> {
    // Check if the refreshing flag is false
    if (!this.blnIsRefreshing) {
      // Set the refreshing flag to true
      this.blnIsRefreshing = true;

      // Call the applications from the authentication service
      return this.objAuthService.getApplications().pipe(
        // After the list of applications is retrieved, switch to the next HTTP request
        switchMap(() => {
          // Reset the refreshing flag
          this.blnIsRefreshing = false;
          // Return the next HTTP request
          return objNext.handle(objRequest);
        }),
        catchError((objError) => {
          this.objAuthService.logoutUser(true).pipe(take(1)).subscribe({})
          return throwError(() => new Error(objError))
        })
      )
    }
    // If the refreshing flag is true
    else {
      // Return the next HTTP request without making any changes
      return objNext.handle(objRequest)
    }
  }

  /**
   * @description handles logout when the token is invalid (Refresh token concept not available)
   * @returns of response
   */
  handle401Unauthoized() {
    if(!this.blnIsLoggingOut){
      this.blnIsLoggingOut = true
      this.objAuthService.logoutUser(true).subscribe({
        next : () => {
          this.postLogoutSteps()
        },
        error : () => {
          this.postLogoutSteps()
        }
      })
    }
    return of()
  }

  /**
   * @description do process need to be done in UI after calling logout API
   */
  postLogoutSteps(){
    this.objNgbModal.dismissAll();
    this.objCommonService.showWarning('Session expired')
    this.blnIsLoggingOut = false
  }

}


export const authInterceptorProviders = [
  {
    // Specify that these providers should be added to the HTTP_INTERCEPTORS array.
    provide: HTTP_INTERCEPTORS,
    // Specify the AuthInterceptor class as the provider.
    useClass: AuthInterceptor,
    // Specify that there can be multiple providers for the HTTP_INTERCEPTORS token.
    multi: true
  }
]