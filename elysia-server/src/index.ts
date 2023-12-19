import { Elysia } from "elysia";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { cors } from "@elysiajs/cors";

const app = new Elysia();

app.use(
  cors({
    origin: ({ headers }) => headers.get("Origin") === "http://localhost:5173",
    credentials: true,
  })
);

const JWKS = createRemoteJWKSet(
  new URL(`${process.env.HANKO_API_URL}/.well-known/jwks.json`)
);

const validateJWT = async (cookie: string) => {
  let token = "";
  if (cookie) {
    token = cookie;
  }
  if (token === null || token.length === 0) {
    console.log("no token");
    return false;
  }
  let authError = false;
  await jwtVerify(token, JWKS).catch((err) => {
    console.log("jwt verify error");
    authError = true;
    console.log(err);
  });
  if (authError) {
    console.log("auth error");
    return false;
  }
  console.log("token valid");
  return true;
};

app.get("/", () => "Elysia x Hanko");

app.get("/protected", () => "Hello Protected", {
  beforeHandle: async ({ set, headers, cookie: { hanko } }) => {
    if (!(await validateJWT(hanko.value))) return (set.status = "Unauthorized");
  },
});

app.listen(8000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
