import { matchLabel } from "./label";

describe("matchLabel", () => {
  it("names each score range", () => {
    expect(matchLabel(100)).toBe("Strong match");
    expect(matchLabel(80)).toBe("Strong match");
    expect(matchLabel(79)).toBe("Good match");
    expect(matchLabel(60)).toBe("Good match");
    expect(matchLabel(59)).toBe("Partial match");
    expect(matchLabel(35)).toBe("Partial match");
    expect(matchLabel(34)).toBe("Early match");
    expect(matchLabel(0)).toBe("Early match");
  });
});
