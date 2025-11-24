import { ApiClient } from "./ApiClient";
import type { ApiConfig } from "./ApiConfig";
import { MainService } from "./services/MainService";
import { UserService } from "./services/UserService";

export class ApiFactory {
  public users: UserService;
  public main: MainService
  private client: ApiClient;
  
  constructor(config: ApiConfig) {
    this.client = new ApiClient(config);

    this.users = new UserService(this.client);
    this.main = new MainService(this.client);
  }
}
