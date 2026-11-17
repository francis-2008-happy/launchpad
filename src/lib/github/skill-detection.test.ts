// Unit tests for skill detection (issue #40).
import {
  dependencyFilesToFetch,
  detectFromDependencyFiles,
  detectFromPaths,
  detectLanguages,
  detectSkills,
  npmPackages,
  pythonPackages,
} from "@/lib/github/skill-detection";

const skills = (list: { skill: string }[]) => list.map((s) => s.skill).sort();

describe("detectLanguages", () => {
  it("keeps the main language and any language with at least 10% of the code", () => {
    const result = detectLanguages({ TypeScript: 8000, CSS: 1500, Shell: 300, JavaScript: 200 });
    expect(result).toEqual([
      { skill: "TypeScript", source: "language" },
      { skill: "CSS", source: "language" },
    ]);
  });

  it("always keeps the largest language, even below 10% of a mixed repo", () => {
    expect(skills(detectLanguages({ Python: 5 }))).toEqual(["Python"]);
  });

  it("maps GitHub language names to our skill names", () => {
    expect(skills(detectLanguages({ SCSS: 50, PLpgSQL: 50 }))).toEqual(["CSS", "SQL"]);
  });

  it("ignores languages that are not in the skills list", () => {
    expect(detectLanguages({ Makefile: 100 })).toEqual([]);
  });

  it("handles a repository with no code", () => {
    expect(detectLanguages({})).toEqual([]);
  });
});

describe("npmPackages", () => {
  it("reads dependencies and devDependencies", () => {
    const json = JSON.stringify({ dependencies: { next: "16", React: "19" }, devDependencies: { jest: "30" } });
    expect(npmPackages(json)).toEqual(["next", "react", "jest"]);
  });

  it("returns nothing for broken JSON instead of failing", () => {
    expect(npmPackages("{ not json")).toEqual([]);
  });
});

describe("pythonPackages", () => {
  it("reads requirements.txt lines with versions, extras, and comments", () => {
    const text = "Django==4.2\nflask>=2  # web\n# pandas\npsycopg2_binary\nuvicorn[standard]\n";
    expect(pythonPackages(text)).toEqual(expect.arrayContaining(["django", "flask", "psycopg2-binary", "uvicorn"]));
    expect(pythonPackages(text)).not.toContain("pandas"); // commented out
  });

  it("reads quoted names in pyproject.toml", () => {
    const text = '[project]\ndependencies = ["fastapi>=0.110", "SQLAlchemy"]\n';
    expect(pythonPackages(text)).toEqual(expect.arrayContaining(["fastapi", "sqlalchemy"]));
  });
});

describe("detectFromDependencyFiles", () => {
  it("finds frameworks, tools, and test libraries in package.json", () => {
    const packageJson = JSON.stringify({
      dependencies: { next: "16", "@supabase/ssr": "1", "@aws-sdk/client-s3": "3" },
      devDependencies: { tailwindcss: "4", jest: "30", "@playwright/test": "1" },
    });
    const result = detectFromDependencyFiles({ "package.json": packageJson });
    expect(skills(result)).toEqual(
      ["AWS", "End-to-end testing", "Jest", "Next.js", "Playwright", "React", "Supabase", "Tailwind CSS", "Unit testing"].sort(),
    );
    expect(result).toContainEqual({ skill: "Jest", source: "tests" });
    expect(result).toContainEqual({ skill: "Next.js", source: "dependency" });
  });

  it("reads package.json files in subfolders like server/", () => {
    const result = detectFromDependencyFiles({ "server/package.json": JSON.stringify({ dependencies: { express: "5", pg: "8" } }) });
    expect(skills(result)).toEqual(["Express", "Node.js", "PostgreSQL"]);
  });

  it("finds Python frameworks and data science libraries", () => {
    const result = detectFromDependencyFiles({ "requirements.txt": "django\ndjangorestframework\npandas\nscikit-learn\npytest\n" });
    expect(skills(result)).toEqual(["Data analysis", "Django", "Machine learning", "REST APIs", "Unit testing"]);
  });

  it("detects .NET from a .csproj file and its test library", () => {
    const csproj = '<Project Sdk="Microsoft.NET.Sdk"><ItemGroup><PackageReference Include="xunit" /></ItemGroup></Project>';
    expect(skills(detectFromDependencyFiles({ "Api/Api.csproj": csproj }))).toEqual([".NET", "Unit testing"]);
  });

  it("detects Spring Boot and JUnit from pom.xml", () => {
    const pom = "<artifactId>spring-boot-starter-web</artifactId><artifactId>junit-jupiter</artifactId>";
    expect(skills(detectFromDependencyFiles({ "pom.xml": pom }))).toEqual(["Spring Boot", "Unit testing"]);
  });

  it("detects Flutter, Rails, and Laravel", () => {
    expect(skills(detectFromDependencyFiles({ "pubspec.yaml": "dependencies:\n  flutter:\n    sdk: flutter\n" }))).toEqual(["Flutter"]);
    expect(skills(detectFromDependencyFiles({ Gemfile: "gem 'rails', '~> 7.1'" }))).toEqual(["Ruby on Rails"]);
    expect(skills(detectFromDependencyFiles({ "composer.json": '{"require":{"laravel/framework":"^11"}}' }))).toEqual(["Laravel"]);
  });
});

describe("detectFromPaths", () => {
  it("detects testing from test files and folders", () => {
    expect(detectFromPaths(["src/app.test.ts"])).toContainEqual({ skill: "Unit testing", source: "tests" });
    expect(detectFromPaths(["tests/test_models.py"])).toContainEqual({ skill: "Unit testing", source: "tests" });
    expect(detectFromPaths(["src/__tests__/button.tsx"])).toContainEqual({ skill: "Unit testing", source: "tests" });
  });

  it("detects end-to-end testing from Playwright config", () => {
    expect(skills(detectFromPaths(["playwright.config.ts"]))).toEqual(["End-to-end testing", "Playwright"]);
  });

  it("detects Docker and CI from config files", () => {
    expect(skills(detectFromPaths(["Dockerfile", ".github/workflows/ci.yml"]))).toEqual(["CI/CD", "Docker", "GitHub Actions"]);
  });

  it("ignores third-party code in node_modules", () => {
    expect(detectFromPaths(["node_modules/lib/index.test.js"])).toEqual([]);
  });

  it("finds nothing in a plain project", () => {
    expect(detectFromPaths(["README.md", "src/index.ts"])).toEqual([]);
  });
});

describe("dependencyFilesToFetch", () => {
  it("picks dependency files up to two folders deep, shallowest first", () => {
    const paths = [
      "README.md",
      "server/package.json",
      "package.json",
      "client/src/deep/package.json",
      "node_modules/react/package.json",
      "Api/Api.csproj",
      "requirements.txt",
    ];
    expect(dependencyFilesToFetch(paths)).toEqual(["package.json", "requirements.txt", "Api/Api.csproj", "server/package.json"]);
  });

  it("fetches at most the given number of files", () => {
    const paths = Array.from({ length: 20 }, (_, i) => `app${i}/package.json`);
    expect(dependencyFilesToFetch(paths, 3)).toHaveLength(3);
  });
});

describe("detectSkills", () => {
  it("combines all evidence and lists each skill once", () => {
    const result = detectSkills({
      languages: { TypeScript: 9000, CSS: 1000 },
      paths: ["package.json", "src/app.test.ts", "Dockerfile"],
      files: { "package.json": JSON.stringify({ dependencies: { react: "19" }, devDependencies: { jest: "30", typescript: "5" } }) },
    });
    expect(skills(result)).toEqual(["CSS", "Docker", "Jest", "React", "TypeScript", "Unit testing"]);
    // Unit testing was found in package.json (jest) and in a test file: listed once.
    expect(result.filter((s) => s.skill === "Unit testing")).toHaveLength(1);
  });

  it("keeps the first kind of evidence when a skill is found more than once", () => {
    // Docker is both a GitHub "language" (Dockerfile) and a config file.
    const result = detectSkills({ languages: { Dockerfile: 100 }, paths: ["Dockerfile"], files: {} });
    expect(result).toEqual([{ skill: "Docker", source: "language" }]);
  });
});
