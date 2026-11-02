import { Injectable } from '@nestjs/common';
import { FastApiService } from '../fastapi-client/apiclient.service.js';

/*
UsersService method	        HTTP	FastAPI endpoint
createUser(data)	        POST	/internal/users
findByEmail(email)	        ET	    /internal/users/by-email
findById(id)	            GET	    /internal/users/:id
findByUsername(username)	GET	    /internal/users/by-username
updateUser(id, data)	    PATCH	/internal/users/:id
deleteUser(id)	            DELETE	/internal/users/:id
*/

@Injectable()
export class UsersService {
  // Inject FastApiClientService through constructor
  constructor(private readonly fastapiservice: FastApiService) {}
  //   async findByEmail(email: string) {
  //     // Call FastApiClientService to fetch user by email
  //   }

  async createUser(data: {
    username: string;
    email: string;
    password: string;
  }) {
    return await this.fastapiservice.post('api/creat-user', data);
  }

  //   async findById(id: string) {
  //     // Call FastApiClientService to find user by ID
  //   }

  //   async findByUsername(username: string) {
  //     // Call FastApiClientService to find user by username
  //   }
  async findByEmail(email: string) {
    return await this.fastapiservice.post('api/find-user', { email: email});
  }

  //   async updateUser(id: string, data: UpdateUserData) {
  //     // Call FastApiClientService to update user
  //   }

  //   async deleteUser(id: string) {
  //     // Call FastApiClientService to delete user
  //   }
}
