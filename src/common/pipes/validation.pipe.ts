import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ValidationPipe implements PipeTransform<unknown> {
  async transform(
    value: unknown,
    { metatype }: ArgumentMetadata,
  ): Promise<unknown> {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype as new () => unknown, value);
    const errors = await validate(object as Record<string, unknown>);

    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }
    return value;
  }

  private toValidate(metatype: new () => unknown): boolean {
    const types: Array<new () => unknown> = [
      String as unknown as new () => unknown,
      Boolean as unknown as new () => unknown,
      Number as unknown as new () => unknown,
      Array as unknown as new () => unknown,
      Object as unknown as new () => unknown,
    ];
    return !types.includes(metatype);
  }
}
