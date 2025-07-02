import { faker } from "@faker-js/faker";
import { Hono } from "hono";
import type { JWTHeaderParameters, JWTPayload } from "jose";
import { jwt, requireScope } from "./middlewares/jwt";

const app = new Hono<{
	Variables: {
		jwtPayload: JWTPayload;
		jwtProtectedHeader: JWTHeaderParameters;
	};
}>();

/**
 * GET /api/health
 * Basic health check endpoint.
 */
app.get("/api/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

/**
 * Middleware to verify the JWT token.
 * The routes defined after this middleware will be protected and require a valid JWT token.
 */
app.use("*", jwt());

/**
 * GET /api/me
 * Returns the current user's claims.
 */
app.get("/api/me", (c) => {
	const claims = c.var.jwtPayload as JWTPayload;
	return c.json({
		...claims,
	});
});

/**
 * GET /api/todos
 * Returns the current user's todos.
 */
app.get("/api/todos", requireScope("read:todos"), async (c) => {
	const user = c.var.jwtPayload as JWTPayload;

	return c.json({
		todos: faker.helpers.multiple(
			() => ({
				date: faker.date.future(),
				description: faker.lorem.paragraph(),
				id: faker.string.uuid(),
				owner: user.sub,
				title: faker.lorem.sentence(),
			}),
			{
				count: 5,
			},
		),
	});
});

/**
 * GET /api/billing
 * Returns the billing settings.
 */
app.get("/api/billing", requireScope("read:billing"), async (c) => {
	return c.json({
		billing: {
			expiration: "01/2025",
			last4: "1234",
			method: "credit-card",
		},
	});
});

export default app;
