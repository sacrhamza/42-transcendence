import type { Request } from 'express';
import { FortyTowUserDto } from '../../dto/forytowuserdto.js';


export type FortyTwoRequest = Request & {
  user: FortyTowUserDto;
};
