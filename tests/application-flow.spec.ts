import { test, expect } from "@playwright/test";

test("candidate applies and employer changes the stage", async ({ browser }) => {
  const candidateState = process.env.PLAYWRIGHT_CANDIDATE_STORAGE;
  const employerState = process.env.PLAYWRIGHT_EMPLOYER_STORAGE;
  const jobId = process.env.PLAYWRIGHT_TEST_JOB_ID;

  test.skip(!candidateState || !employerState || !jobId, "Set synthetic test-account storage states and job ID");

  const candidateContext = await browser.newContext({ storageState: candidateState });
  const candidate = await candidateContext.newPage();

  await candidate.goto(`/jobs/${jobId}`);
  await candidate.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(candidate.getByRole("button", { name: "Applied", exact: true })).toBeVisible();

  await candidate.goto("/candidate/applications");
  await expect(candidate.getByTestId("application-card")).toBeVisible();
  await expect(candidate.getByTestId("application-stage")).toHaveText("Applied");

  const employerContext = await browser.newContext({ storageState: employerState });
  const employer = await employerContext.newPage();
  await employer.goto(`/employer/jobs/${jobId}/applicants`);
  await employer.getByTestId("stage-select").selectOption("interviewing");
  await expect(employer.getByTestId("stage-select")).toHaveValue("interviewing");

  await candidate.reload();
  await expect(candidate.getByTestId("application-stage")).toHaveText("Interviewing");

  await candidateContext.close();
  await employerContext.close();
});
