// A laptop "picture" showing the candidate dashboard, built with HTML and
// Tailwind. All names and numbers are sample data.
//
// The laptop screen uses a Tailwind container query (@container): its content
// adapts to the width of the *screen*, not the browser window, so the mini
// dashboard still fits when the laptop is drawn small on a phone.
import { GitHubIcon } from "@/components/icons";
import { Avatar, people } from "@/components/landing/product-mockups";

export function LaptopFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      {/* Screen with a dark bezel */}
      <div className="rounded-t-2xl border-[6px] border-b-0 border-slate-900 bg-slate-900 sm:border-[10px] sm:border-b-0">
        <div className="@container aspect-[16/9] overflow-hidden rounded-t-md bg-background">{children}</div>
      </div>
      {/* Keyboard base: slightly wider than the screen */}
      <div className="relative -mx-[4%] h-3 rounded-b-2xl bg-slate-300 sm:h-4 dark:bg-slate-600">
        <div className="absolute top-0 left-1/2 h-1.5 w-1/6 -translate-x-1/2 rounded-b-md bg-slate-400 dark:bg-slate-800" />
      </div>
    </div>
  );
}

const stats = [
  { label: "Verified skills", value: "14" },
  { label: "Repos analyzed", value: "12" },
  { label: "Applications", value: "3" },
];

const jobs = [
  { title: "Frontend Engineer", company: "Brightpath Labs", match: 92 },
  { title: "Full-Stack Developer", company: "Northwind", match: 84 },
  { title: "React Developer", company: "Kora Health", match: 79 },
];

const applications = [
  { title: "Junior Full-Stack Developer", company: "Brightpath Labs", stage: "Interviewing" },
  { title: "Frontend Engineer", company: "Northwind", stage: "Reviewing" },
  { title: "Web Developer", company: "Sunline Studio", stage: "Applied" },
];

// A candidate dashboard, shown inside the laptop.
export function CandidateDashboardScreen() {
  return (
    <div aria-hidden="true" className="flex h-full text-[6px] @xs:text-[7px] @sm:text-[8px] @lg:text-[10px] @2xl:text-[13px]">
      {/* Sidebar (hidden when the screen is very narrow) */}
      <div className="hidden w-[22%] shrink-0 flex-col gap-1 border-r border-border bg-surface p-2 @sm:flex @lg:p-3">
        <div className="mb-2 flex items-center gap-1 font-bold">
          <span className="h-3 w-3 rounded bg-primary @lg:h-4 @lg:w-4" /> LaunchPad
        </div>
        {["Dashboard", "My skills", "Jobs", "Applications"].map((item, i) => (
          <span key={item} className={`rounded px-1.5 py-1 ${i === 0 ? "bg-primary-soft font-semibold text-primary-text" : "text-muted"}`}>
            {item}
          </span>
        ))}
      </div>

      {/* Main area */}
      <div className="flex-1 space-y-2 overflow-hidden p-2 @lg:space-y-3 @lg:p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="hidden @sm:block">
              <Avatar person={people.amara} size={22} />
            </span>
            <div>
              <p className="font-bold @lg:text-[1.2em]">Welcome back, Amara</p>
              <p className="flex items-center gap-1 text-muted">
                <GitHubIcon className="h-2 w-2 @lg:h-3 @lg:w-3" /> Synced with GitHub today
              </p>
            </div>
          </div>
          <span className="rounded-full bg-accent-soft px-1.5 py-0.5 font-semibold text-accent-text">Profile 90% complete</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 @lg:gap-2">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-md border border-border bg-card p-1.5 @lg:p-2">
              <p className="text-muted">{stat.label}</p>
              <p className="text-[1.6em] font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-5 gap-1.5 @lg:gap-2">
          {/* Skill chart */}
          <div className="col-span-3 rounded-md border border-border bg-card p-1.5 @lg:p-2">
            <p className="mb-1 font-semibold">Top verified skills</p>
            <div className="flex h-[7em] items-end gap-[6%]">
              {[92, 88, 74, 61, 55, 48].map((height, i) => (
                <div key={i} className={`grow-column flex-1 rounded-t-sm ${i === 0 ? "bg-primary" : "bg-primary/35"}`} style={{ height: `${height}%` }} />
              ))}
            </div>
          </div>
          {/* Recommended jobs */}
          <div className="col-span-2 space-y-1 rounded-md border border-border bg-card p-1.5 @lg:p-2">
            <p className="font-semibold">Recommended</p>
            {jobs.map((job) => (
              <div key={job.title} className="flex items-center justify-between gap-1">
                <span className="truncate">{job.title}</span>
                <span className="font-semibold text-accent-text">{job.match}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Applications table */}
        <div className="rounded-md border border-border bg-card p-1.5 @lg:p-2">
          <p className="mb-1 font-semibold">My applications</p>
          {applications.map((app) => (
            <div key={app.title} className="flex items-center justify-between gap-2 border-t border-border py-1 first-of-type:border-t-0">
              <span className="truncate">
                {app.title} <span className="text-muted">· {app.company}</span>
              </span>
              <span className="shrink-0 rounded-full bg-primary-soft px-1.5 font-medium text-primary-text">{app.stage}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
