import { Type } from "class-transformer";
import { IsObject, IsOptional, IsString, ValidateNested } from "class-validator";
import { PositionDto } from "./position.dto";

export class CreateNodeDto {
    @IsString()
    @IsOptional()
    id?: string; // Permitimos que el front envíe su ID temporal

    @IsString()
    type: string; // Este será el 'code' de NodeType (ej: 'orchestrator')

    @ValidateNested()
    @Type(() => PositionDto)
    position: PositionDto;

    @IsObject()
    data: any; // Configuración específica del nodo (prompt, modelo, etc.)
}