// Skill detection (issue #40): works out which skills a repository proves.
//
// Three kinds of evidence, matching the "source" column in candidate_skills:
//   language    the languages GitHub reports for the repository
//   dependency  frameworks and tools listed in dependency files (package.json,
//               requirements.txt, *.csproj, pom.xml, ...) and tool config files
//               (Dockerfile, GitHub Actions workflows, ...)
//   tests       test folders, test files, test config files, and test libraries
//
// Every skill name returned here matches a name in the `skills` table (#47).
// These are pure functions: they get data already fetched from GitHub and
// return results, so they are easy to unit test.

export type SkillSource = "language" | "dependency" | "tests";
export type DetectedSkill = { skill: string; source: SkillSource };

// Everything we know about one repository.
export type RepoScan = {
  languages: Record<string, number>; // bytes of code per language, from GitHub
  paths: string[]; // every file path in the repository
  files: Record<string, string>; // contents of the dependency files we fetched, by path
};

// Keeps the first entry for each skill, so every skill appears once.
function unique(list: DetectedSkill[]): DetectedSkill[] {
  const seen = new Set<string>();
  return list.filter(({ skill }) => (seen.has(skill) ? false : (seen.add(skill), true)));
}

// ---------- Languages ----------

// GitHub language name -> our skill name.
const LANGUAGE_SKILLS: Record<string, string> = {
  JavaScript: "JavaScript",
  TypeScript: "TypeScript",
  Python: "Python",
  "Jupyter Notebook": "Python",
  Java: "Java",
  "C#": "C#",
  "C++": "C++",
  C: "C",
  Go: "Go",
  Rust: "Rust",
  PHP: "PHP",
  Ruby: "Ruby",
  Kotlin: "Kotlin",
  Swift: "Swift",
  Dart: "Dart",
  HTML: "HTML",
  CSS: "CSS",
  SCSS: "CSS",
  Sass: "CSS",
  Less: "CSS",
  Shell: "Shell",
  SQL: "SQL",
  PLpgSQL: "SQL",
  TSQL: "SQL",
  PLSQL: "SQL",
  Vue: "Vue",
  Svelte: "Svelte",
  Dockerfile: "Docker",
};

// A language counts when it is the repository's main language, or at least 10%
// of its code. This skips tiny amounts, like one shell script in a Java project.
export const LANGUAGE_MIN_SHARE = 0.1;

export function detectLanguages(languages: Record<string, number>): DetectedSkill[] {
  const entries = Object.entries(languages);
  const total = entries.reduce((sum, [, bytes]) => sum + bytes, 0);
  if (total === 0) return [];
  const largest = Math.max(...entries.map(([, bytes]) => bytes));

  return entries
    .filter(([name, bytes]) => LANGUAGE_SKILLS[name] && (bytes === largest || bytes / total >= LANGUAGE_MIN_SHARE))
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => ({ skill: LANGUAGE_SKILLS[name], source: "language" as const }));
}

// ---------- Dependency files ----------

type Rule = { packages: string[]; skills: string[]; source?: SkillSource };

// JavaScript and TypeScript packages in package.json.
const NPM_RULES: Rule[] = [
  { packages: ["react", "react-dom"], skills: ["React"] },
  { packages: ["next"], skills: ["Next.js", "React"] },
  { packages: ["vue", "nuxt"], skills: ["Vue"] },
  { packages: ["@angular/core"], skills: ["Angular"] },
  { packages: ["svelte", "@sveltejs/kit"], skills: ["Svelte"] },
  { packages: ["express"], skills: ["Express", "Node.js"] },
  { packages: ["@nestjs/core"], skills: ["NestJS", "Node.js"] },
  { packages: ["fastify", "koa", "@hapi/hapi"], skills: ["Node.js"] },
  { packages: ["react-native", "expo"], skills: ["React Native"] },
  { packages: ["tailwindcss", "@tailwindcss/postcss", "@tailwindcss/vite"], skills: ["Tailwind CSS"] },
  { packages: ["@supabase/supabase-js", "@supabase/ssr"], skills: ["Supabase"] },
  { packages: ["firebase", "firebase-admin"], skills: ["Firebase"] },
  { packages: ["mongodb", "mongoose"], skills: ["MongoDB"] },
  { packages: ["pg", "postgres", "@neondatabase/serverless"], skills: ["PostgreSQL"] },
  { packages: ["mysql", "mysql2"], skills: ["MySQL"] },
  { packages: ["redis", "ioredis", "@upstash/redis"], skills: ["Redis"] },
  { packages: ["graphql", "@apollo/client", "@apollo/server", "apollo-server"], skills: ["GraphQL"] },
  { packages: ["aws-sdk"], skills: ["AWS"] },
  { packages: ["prisma", "@prisma/client", "drizzle-orm"], skills: ["Database design"] },
  { packages: ["next-auth", "passport", "jsonwebtoken", "bcrypt", "bcryptjs", "@clerk/nextjs"], skills: ["Authentication"] },
  { packages: ["jest", "ts-jest", "babel-jest"], skills: ["Jest", "Unit testing"], source: "tests" },
  { packages: ["vitest", "mocha", "@testing-library/react", "@testing-library/jest-dom"], skills: ["Unit testing"], source: "tests" },
  { packages: ["@playwright/test", "playwright"], skills: ["Playwright", "End-to-end testing"], source: "tests" },
  { packages: ["cypress"], skills: ["End-to-end testing"], source: "tests" },
];

// Package name prefixes, for scoped packages like @aws-sdk/client-s3.
const NPM_PREFIX_RULES: { prefix: string; skills: string[] }[] = [
  { prefix: "@aws-sdk/", skills: ["AWS"] },
  { prefix: "@google-cloud/", skills: ["Google Cloud"] },
  { prefix: "@azure/", skills: ["Azure"] },
  { prefix: "@vercel/", skills: ["Vercel"] },
];

// Python packages in requirements.txt, pyproject.toml, or Pipfile.
const PYTHON_RULES: Rule[] = [
  { packages: ["django"], skills: ["Django"] },
  { packages: ["djangorestframework"], skills: ["Django", "REST APIs"] },
  { packages: ["flask"], skills: ["Flask"] },
  { packages: ["fastapi"], skills: ["FastAPI", "REST APIs"] },
  { packages: ["tensorflow", "keras"], skills: ["TensorFlow", "Machine learning"] },
  { packages: ["torch", "pytorch-lightning"], skills: ["PyTorch", "Machine learning"] },
  { packages: ["scikit-learn", "xgboost", "lightgbm"], skills: ["Machine learning"] },
  { packages: ["pandas", "numpy", "matplotlib", "seaborn", "plotly"], skills: ["Data analysis"] },
  { packages: ["psycopg2", "psycopg2-binary", "psycopg", "asyncpg"], skills: ["PostgreSQL"] },
  { packages: ["pymysql", "mysqlclient"], skills: ["MySQL"] },
  { packages: ["pymongo"], skills: ["MongoDB"] },
  { packages: ["redis"], skills: ["Redis"] },
  { packages: ["boto3"], skills: ["AWS"] },
  { packages: ["supabase"], skills: ["Supabase"] },
  { packages: ["firebase-admin"], skills: ["Firebase"] },
  { packages: ["pytest"], skills: ["Unit testing"], source: "tests" },
  { packages: ["playwright", "pytest-playwright"], skills: ["Playwright", "End-to-end testing"], source: "tests" },
];

// Other ecosystems, matched by a word in the file.
const TEXT_RULES: { file: RegExp; contains: RegExp; skills: string[]; source?: SkillSource }[] = [
  { file: /\.csproj$/i, contains: /./, skills: [".NET"] },
  { file: /\.csproj$/i, contains: /\b(xunit|nunit|mstest)\b/i, skills: ["Unit testing"], source: "tests" },
  { file: /\.csproj$/i, contains: /\bnpgsql\b/i, skills: ["PostgreSQL"] },
  { file: /(^|\/)(pom\.xml|build\.gradle(\.kts)?)$/i, contains: /spring-boot/i, skills: ["Spring Boot"] },
  { file: /(^|\/)(pom\.xml|build\.gradle(\.kts)?)$/i, contains: /\bjunit\b/i, skills: ["Unit testing"], source: "tests" },
  { file: /(^|\/)(pom\.xml|build\.gradle(\.kts)?)$/i, contains: /\bpostgresql\b/i, skills: ["PostgreSQL"] },
  { file: /(^|\/)(pom\.xml|build\.gradle(\.kts)?)$/i, contains: /\bmysql\b/i, skills: ["MySQL"] },
  { file: /(^|\/)pubspec\.yaml$/i, contains: /^\s*flutter\s*:/m, skills: ["Flutter"] },
  { file: /(^|\/)pubspec\.yaml$/i, contains: /^\s*firebase_core\s*:/m, skills: ["Firebase"] },
  { file: /(^|\/)Gemfile$/, contains: /gem\s+["']rails["']/, skills: ["Ruby on Rails"] },
  { file: /(^|\/)Gemfile$/, contains: /gem\s+["']rspec/, skills: ["Unit testing"], source: "tests" },
  { file: /(^|\/)composer\.json$/i, contains: /"laravel\/framework"/, skills: ["Laravel"] },
  { file: /(^|\/)composer\.json$/i, contains: /"phpunit\/phpunit"/, skills: ["Unit testing"], source: "tests" },
];

// All package names in a package.json (dependencies and devDependencies).
export function npmPackages(packageJson: string): string[] {
  try {
    const data = JSON.parse(packageJson) as Record<string, unknown>;
    const names: string[] = [];
    for (const key of ["dependencies", "devDependencies", "peerDependencies"]) {
      const section = data[key];
      if (section && typeof section === "object") names.push(...Object.keys(section));
    }
    return names.map((name) => name.toLowerCase());
  } catch {
    return []; // not valid JSON: ignore it rather than fail the whole import
  }
}

// Package names in a Python requirements.txt, pyproject.toml, or Pipfile.
// It looks for names at the start of a line or inside quotes, then normalises
// them (lowercase, "_" -> "-"), as pip does.
export function pythonPackages(text: string): string[] {
  const names = new Set<string>();
  const pattern = /(?:^|["'])\s*([A-Za-z0-9][A-Za-z0-9._-]*)\s*(?=[<>=!~;\[\s"',]|$)/gm;
  for (const match of text.matchAll(pattern)) {
    names.add(match[1].toLowerCase().replace(/_/g, "-"));
  }
  return [...names];
}

function applyRules(found: string[], rules: Rule[]): DetectedSkill[] {
  const result: DetectedSkill[] = [];
  for (const rule of rules) {
    if (rule.packages.some((name) => found.includes(name))) {
      for (const skill of rule.skills) result.push({ skill, source: rule.source ?? "dependency" });
    }
  }
  return result;
}

export function detectFromDependencyFiles(files: Record<string, string>): DetectedSkill[] {
  const result: DetectedSkill[] = [];
  for (const [path, text] of Object.entries(files)) {
    const name = path.split("/").pop() ?? path;

    if (name === "package.json") {
      const packages = npmPackages(text);
      result.push(...applyRules(packages, NPM_RULES));
      for (const rule of NPM_PREFIX_RULES) {
        if (packages.some((pkg) => pkg.startsWith(rule.prefix))) {
          result.push(...rule.skills.map((skill) => ({ skill, source: "dependency" as const })));
        }
      }
    }

    if (/^(requirements.*\.txt|pyproject\.toml|Pipfile)$/i.test(name)) {
      result.push(...applyRules(pythonPackages(text), PYTHON_RULES));
    }

    for (const rule of TEXT_RULES) {
      if (rule.file.test(path) && rule.contains.test(text)) {
        result.push(...rule.skills.map((skill) => ({ skill, source: rule.source ?? ("dependency" as const) })));
      }
    }
  }
  return unique(result);
}

// ---------- File paths: tools, CI, and tests ----------

const PATH_RULES: { pattern: RegExp; skills: string[]; source: SkillSource }[] = [
  // Tools and practices shown by config files
  { pattern: /(^|\/)(Dockerfile|docker-compose\.ya?ml|compose\.ya?ml)$/i, skills: ["Docker"], source: "dependency" },
  { pattern: /^\.github\/workflows\/[^/]+\.ya?ml$/i, skills: ["GitHub Actions", "CI/CD"], source: "dependency" },
  { pattern: /^(\.gitlab-ci\.yml|\.circleci\/config\.yml|azure-pipelines\.yml|Jenkinsfile)$/i, skills: ["CI/CD"], source: "dependency" },
  { pattern: /(^|\/)(k8s|kubernetes|helm)\/|(^|\/)Chart\.yaml$/i, skills: ["Kubernetes"], source: "dependency" },
  { pattern: /^vercel\.json$/i, skills: ["Vercel"], source: "dependency" },
  { pattern: /^firebase\.json$/i, skills: ["Firebase"], source: "dependency" },
  { pattern: /^supabase\/(config\.toml|migrations\/)/i, skills: ["Supabase", "Database design"], source: "dependency" },
  { pattern: /(^|\/)schema\.prisma$/i, skills: ["Database design"], source: "dependency" },
  // Testing
  { pattern: /(^|\/)jest\.config\.[cm]?[jt]s$/i, skills: ["Jest", "Unit testing"], source: "tests" },
  { pattern: /(^|\/)vitest\.config\.[cm]?[jt]s$/i, skills: ["Unit testing"], source: "tests" },
  { pattern: /(^|\/)playwright\.config\.[cm]?[jt]s$/i, skills: ["Playwright", "End-to-end testing"], source: "tests" },
  { pattern: /(^|\/)cypress(\.config\.[cm]?[jt]s|\/)|(^|\/)e2e\//i, skills: ["End-to-end testing"], source: "tests" },
  { pattern: /(^|\/)(__tests__|tests?|spec)\//i, skills: ["Unit testing"], source: "tests" },
  { pattern: /\.(test|spec)\.[cm]?[jt]sx?$/i, skills: ["Unit testing"], source: "tests" },
  { pattern: /(^|\/)test_[^/]+\.py$|_test\.(py|go)$/i, skills: ["Unit testing"], source: "tests" },
  { pattern: /Tests?\.(cs|java|kt)$/, skills: ["Unit testing"], source: "tests" },
];

// Third-party code that some people commit by mistake. It is not their own work.
const IGNORED_PATH = /(^|\/)(node_modules|vendor|bower_components|\.venv|venv|site-packages)\//;

export function ownPaths(paths: string[]): string[] {
  return paths.filter((path) => !IGNORED_PATH.test(path));
}

export function detectFromPaths(paths: string[]): DetectedSkill[] {
  const result: DetectedSkill[] = [];
  const own = ownPaths(paths);
  for (const rule of PATH_RULES) {
    if (own.some((path) => rule.pattern.test(path))) {
      result.push(...rule.skills.map((skill) => ({ skill, source: rule.source })));
    }
  }
  return unique(result);
}

// ---------- Which dependency files to download ----------

const DEPENDENCY_FILE = /(^|\/)(package\.json|requirements[^/]*\.txt|pyproject\.toml|Pipfile|pubspec\.yaml|Gemfile|composer\.json|pom\.xml|build\.gradle(\.kts)?|[^/]+\.csproj)$/i;

// The dependency files worth reading: at most two folders deep (so "client/"
// and "server/" folders in student projects are included), at most 8 files.
export function dependencyFilesToFetch(paths: string[], max = 8): string[] {
  return ownPaths(paths)
    .filter((path) => DEPENDENCY_FILE.test(path) && path.split("/").length <= 3)
    .sort((a, b) => a.split("/").length - b.split("/").length || a.localeCompare(b))
    .slice(0, max);
}

// ---------- Everything together ----------

// All skills one repository proves. Each skill appears once; when it was found
// in more than one way, the first kind of evidence wins (language, then
// dependency files, then file paths).
export function detectSkills(scan: RepoScan): DetectedSkill[] {
  return unique([...detectLanguages(scan.languages), ...detectFromDependencyFiles(scan.files), ...detectFromPaths(scan.paths)]);
}
