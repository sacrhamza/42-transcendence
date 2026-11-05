import { RegisterDto } from '../dto/RegisterDto.js';

const password_validation = (dto: RegisterDto) => {
  return dto.password
    .toLocaleLowerCase()
    .includes(dto.username.toLocaleLowerCase());
};

const validations = {
  validators: {
    register: {
      password: password_validation,
      message: 'Password must not contain username',
    },
  },
};

export default validations;
