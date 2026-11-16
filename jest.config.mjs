// Jest configuration for unit tests (issue #38).
// Unit tests cover the pure business logic in src/lib/ (validation, skill
// detection, match scoring). Pages and components are tested end to end with
// Playwright instead.
//
// next/jest sets up the Next.js compiler, so TypeScript works without extra
// packages. Run the tests with `npm test`.
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const config = {
  // The logic we test is plain TypeScript, so it runs in Node (no browser needed).
  testEnvironment: "node",
  // Tests live next to the code they test, named *.test.ts.
  testMatch: ["<rootDir>/src/**/*.test.ts"],
  // Lets tests import with "@/..." just like the app (same as "paths" in tsconfig.json).
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};

export default createJestConfig(config);
