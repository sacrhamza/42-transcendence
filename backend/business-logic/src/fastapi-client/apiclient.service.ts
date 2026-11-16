

/* mazal ma3arfinch wach ankhmo bih ndiro forward dyal req mn nest aplication
l fas-api aplication */


// import {
//   Injectable,
//   GatewayTimeoutException,
//   NotFoundException,
//   BadGatewayException,
//   ServiceUnavailableException,
//   HttpException,
// } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { error } from 'console';

// @Injectable()
// export class FastApiService {
//   // initial some configiration !
//   private readonly baseUrl: string;
//   private readonly secret: string;

//   constructor(private readonly config: ConfigService) {
//     this.baseUrl = this.config.getOrThrow<string>('FASTAPI_URL');
//     this.secret = this.config.getOrThrow<string>('INTERNAL_API_KEY');
//   }

//   async get(endpoint: string) {
//     let response: Response;
//     const signal: AbortSignal = AbortSignal.timeout(5000);
//     try {
//       response = await fetch(this.baseUrl + endpoint, {
//         method: 'GET',
//         headers: {
//           'X-Internal-API-Key': this.secret,
//         },
//         signal: signal,
//       });
//       // check some cases by using status code !!
//       if (!response.ok) {
//         switch (response.status) {
//           case 404:
//             throw new NotFoundException('Resource not found');
//           // more status code ... ta ntchawro alihom ana o abdela
//           default:
//             throw new BadGatewayException('The data service returned an error');
//         }
//       }

//       // this case if we don't have a data in the pstgressql !
//       if (response.status === 204)
//         throw new BadGatewayException('The data service returned no content');

//       return await response.json();
//     } catch (error) {
//       if (error instanceof HttpException) {
//         throw error;
//       }
//       if (signal.aborted) {
//         throw new GatewayTimeoutException(
//           'The data service took too long to respond',
//         );
//       }
//       if (error instanceof SyntaxError) {
//         throw new BadGatewayException('The data service returned invalid JSON');
//       }
//     }

//     // if the server has unavailable we can get any respons ...
//     throw new ServiceUnavailableException('The data service is unavailable');
//   }

//   //   async post(endpoint: string, data: any) {
//   //     let response: Response;

//   //     response = await fetch(`${this.baseUrl}${endpoint}`, {
//   //       method: 'POST',
//   //       headers: {
//   //         'Content-Type': 'application/json',
//   //         'X-Internal-API-Key': this.secret,
//   //       },
//   //       signal: AbortSignal.timeout(5000),
//   //       body: JSON.stringify(data),
//   //     });

//   //     return response.json();
//   //   }
//   // }

//   async post(endpoint: string, data: any) {
//     let response: Response;
//     const signal: AbortSignal = AbortSignal.timeout(5000);
//     try {
//       response = await fetch(this.baseUrl + endpoint, {
//         method: 'POST',
//         headers: {
//           'X-Internal-API-Key': this.secret,
//         },
//         signal: signal,
//         body: JSON.stringify(data),
//       });
//       // check some cases by using status code !!
//       // console.log('FastAPI status:', response.status);
//       // console.log('FastAPI response:', await response.clone().text());
//       if (!response.ok) {
//         console.log('FastAPI status:', response.status);
//         console.log('FastAPI response:', await response.clone().text());
//         switch (response.status) {
//           case 404:
//             throw new NotFoundException('Resource not found');
//           // more status code ... ta ntchawro alihom ana o abdela
//           default:
//             throw new BadGatewayException('The data service returned an error');
//         }
//       }

//       // this case if we don't have a data in the pstgressql !
//       if (response.status === 204)
//         throw new BadGatewayException('The data service returned no content');

//       return await response.json();
//     } catch (error) {
//       if (error instanceof HttpException) {
//         throw error;
//       }
//       if (signal.aborted) {
//         throw new GatewayTimeoutException(
//           'The data service took too long to respond',
//         );
//       }
//       if (error instanceof SyntaxError) {
//         throw new BadGatewayException('The data service returned invalid JSON');
//       }
//     }


//     // if the server has unavailable we can get any respons ...
//     throw new ServiceUnavailableException('The data service is unavailable');
//   }
// }
