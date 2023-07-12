import { Injectable } from "@angular/core";
import {environment } from "../../../environments/environment"
@Injectable()
export class AppConstants {

    public static APP_TITLE_COMMON = 'HRMS ';
    public static API_URL = environment.api_url;
    public static API_URL_GROUP = environment.api_url+"groups/"
    public static API_URL_GROUP_DELETE = 'https://app.hexabase.com/v1/api/post_delete_group'
    public static API_URL_ROLE = environment.api_url+"applications/"+environment.application_id+"/userroles"
    public static API_URL_ROLE_USERS = environment.api_url+"applications/"+environment.application_id+"/roleusers/"
    public static API_URL_APPLICATIONS = environment.api_url+"workspaces/"+environment.workspace_id+"/applications"
    public static API_URL_USER = environment.api_url+"applications/"+environment.application_id+"/datastores/"+environment.user_datastore_id+"/"
    public static API_URL_ATTENDANCE = environment.api_url+"applications/"+environment.application_id+"/datastores/"+environment.attandance_datastore_id+"/"
    
    public static REGEX_DATE = /^((0[1-9]|[1-2][0-9]|3[0-1])\/(0[1-9]|1[0-2])\/\d{4})|(\d{4}\/(0[1-9]|1[0-2])\/(0[1-9]|[1-2][0-9]|3[0-1]))\s*$/
    public static REGEX_EMAIL = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/
    
}
