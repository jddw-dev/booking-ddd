import { ExceptionBase } from '@src/libs/exceptions';

export class InvalidEmailError extends ExceptionBase {
  static readonly message: string = 'Invalid email';
  public readonly code: string = 'EMAIL.INVALID';

  constructor(cause?: unknown) {
    super(InvalidEmailError.message, cause);
  }
}

export class InvalidWebsiteError extends ExceptionBase {
  static readonly message: string = 'Invalid website';
  public readonly code: string = 'WEBSITE.INVALID';

  constructor(cause?: unknown) {
    super(InvalidWebsiteError.message, cause);
  }
}

export class AddressError extends ExceptionBase {
  static readonly message: string = 'Invalid address';
  public readonly code: string = 'ADDRESS.INVALID';

  constructor(cause?: unknown) {
    super(AddressError.message, cause);
  }
}

export class ContactInfosError extends ExceptionBase {
  static readonly message: string = 'Invalid contact infos';
  public readonly code: string = 'CONTACT_INFOS.INVALID';

  constructor(message?: string, cause?: unknown) {
    super(message || ContactInfosError.message, cause);
  }
}
