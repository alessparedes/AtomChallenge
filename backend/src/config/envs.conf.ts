import 'dotenv/config';
import * as joi from 'joi';

if (process.env.NODE_ENV !== 'production') {
    const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env.development';
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('dotenv').config({ path: envFile });
}

const envsSchema = joi.object({
    NODE_ENV: joi.string()
        .valid('development', 'production', 'test')
        .default('development'),
    PORT: joi.number()
        .required()
        .default(3000),
    DATABASE_URL: joi.string().required(),
    PG_HOST: joi.string().required(),
    PG_PORT: joi.number().required(),
    PG_USER: joi.string().required(),
    PG_PASSWORD: joi.string().required(),
    PG_DB: joi.string().required(),
}).unknown().required();

const { error, value } = envsSchema.validate(process.env);

if (error) {
    throw new Error(`Configuración inválida: ${error.message}`);
}

export const envs = {
    NODE_ENV: value.NODE_ENV,
    PORT: value.PORT,
    DATABASE_URL: value.DATABASE_URL,
    PG_HOST: value.PG_HOST,
    PG_PORT: value.PG_PORT,
    PG_USER: value.PG_USER,
    PG_PASSWORD: value.PG_PASSWORD,
    PG_DB: value.PG_DB,
};