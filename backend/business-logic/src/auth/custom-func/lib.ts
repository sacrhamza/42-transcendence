import { RegisterDto } from '../dto/RegisterDto.js';

const password_validation = (dto: RegisterDto) => {
  
  return dto.password.includes(dto.username);
};

const validations = {
  validators: {
    register: {
      password: password_validation,
      message: 'Password must not contain personal information',
    },
  },
};

export default validations;
