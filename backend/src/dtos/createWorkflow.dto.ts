import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsOptional, IsString, ValidateNested } from "class-validator";
import { CreateNodeDto } from "./createNode.dto";
import { CreateEdgeDto } from "./createEdge.dto";

export class CreateWorkflowDto {
    @IsString()
    name: string;

    @IsBoolean()
    @IsOptional()
    isActive: boolean = true;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateNodeDto)
    nodes: CreateNodeDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateEdgeDto)
    edges: CreateEdgeDto[];
}