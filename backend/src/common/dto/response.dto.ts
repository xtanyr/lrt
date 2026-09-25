export class ApiResponseDto<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any;

  constructor(success: boolean, data?: T, message?: string, errors?: any) {
    this.success = success;
    this.data = data;
    this.message = message;
    this.errors = errors;
  }

  static success<T>(data: T, message?: string): ApiResponseDto<T> {
    return new ApiResponseDto(true, data, message);
  }

  static error<T>(message: string, errors?: any): ApiResponseDto<T> {
    return new ApiResponseDto<T>(false, undefined, message, errors);
  }
}
