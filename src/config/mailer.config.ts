import { registerAs } from "@nestjs/config";

export default registerAs('mailer',()=>({
host: process.env.MAILER_HOST,
port: process.env.MAILER_PORT,
user: process.env.USER_EMAIL,
pass: process.env.USER_PASS
}))