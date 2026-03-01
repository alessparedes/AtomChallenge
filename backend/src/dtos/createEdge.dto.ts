import { IsString } from "class-validator";

export class CreateEdgeDto {
    @IsString()
    source: string;

    @IsString()
    target: string;
}