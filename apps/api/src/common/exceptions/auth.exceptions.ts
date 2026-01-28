import { HttpException, HttpStatus } from '@nestjs/common'

export class UserNotFoundException extends HttpException {
  constructor() {
    super('not_found', HttpStatus.UNAUTHORIZED)
  }
}

export class EmailNotVerifiedException extends HttpException {
  constructor() {
    super('email_not_verified', HttpStatus.UNAUTHORIZED)
  }
}

export class InvalidPasswordException extends HttpException {
  constructor() {
    super('invalid_password', HttpStatus.UNAUTHORIZED)
  }
}

export class InvalidRefreshTokenException extends HttpException {
  constructor() {
    super('invalid_refresh_token', HttpStatus.UNAUTHORIZED)
  }
}

export class UserHasNoAccessException extends HttpException {
  constructor() {
    super('user_has_no_access', HttpStatus.UNAUTHORIZED)
  }
}

export class InvalidCodeException extends HttpException {
  constructor() {
    super('invalid_code', HttpStatus.UNAUTHORIZED)
  }
}

export class ExpiredCodeException extends HttpException {
  constructor() {
    super('expired_code', HttpStatus.UNAUTHORIZED)
  }
}
