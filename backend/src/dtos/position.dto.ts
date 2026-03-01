import { IsNumber } from "class-validator";

export class PositionDto {
    @IsNumber()
    x: number;

    @IsNumber()
    y: number;
}