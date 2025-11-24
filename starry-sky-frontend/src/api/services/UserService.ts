import type { ApiClient } from "../ApiClient";

export interface User {
  id: number;
  name: string;
  email: string;
}

export class UserService {
    private api: ApiClient
    constructor(api: ApiClient) {
        this.api = api
    }

    // GET /users  (auto-cancels on repeated calls)
    getAllUsers() {
        return this.api.get<User[]>("/users");
    }

    // GET /users/:id  (auto-cancels per unique URL)
    getUserById(id: number) {
        return this.api.get<User>(`/users/${id}`);
    }
}
