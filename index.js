import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";
import fs from "fs";

// DOCS: https://github.com/GoogleChrome/lighthouse/blob/HEAD/docs/readme.md#using-programmatically

const url = "https://localhost:44051/prada/prada-paradoxe-parfemovana-voda-plnitelna-pro-zeny/p-16145465/";

const main = async () => {
  const testRuns = [];

  const chrome = await launch({ chromeFlags: ["--headless"] });

  const runTest = async (testName) => {
    console.log("RUNNING TEST " + testName);

    const result = await lighthouse(
      url,
      { ogLevel: "info", onlyCategories: ["performance"], port: chrome.port, output: "json" },
      {
        extends: "lighthouse:default",
        settings: {
          onlyAudits: ["first-contentful-paint", "largest-contentful-paint", "total-blocking-time"],
        },
      }
    );
    return {
      fcp: result.lhr.audits["first-contentful-paint"].numericValue,
      lcp: result.lhr.audits["largest-contentful-paint"].numericValue,
      tbt: result.lhr.audits["total-blocking-time"].numericValue,
    };
  };

  const getAverages = () => {
    const accumulated = testRuns.reduce(
      (acc, curr) => ({ lcp: acc.lcp + curr.lcp, fcp: acc.fcp + curr.fcp, tbt: acc.tbt + curr.tbt }),
      {
        lcp: 0,
        fcp: 0,
        tbt: 0,
      }
    );

    const length = testRuns.length;
    return { lcp: accumulated.lcp / length, fcp: accumulated.fcp / length, tbt: accumulated.tbt / length };
  };

  //warmup
  await runTest("Warming up...");

  for (let i = 0; i < 10; i++) {
    const result = await runTest(i + 1);
    testRuns.push(result);
  }

  fs.writeFileSync("results/result-old.json", JSON.stringify({ testRuns, avgs: getAverages() }));

  await chrome.kill();
  console.log("DONE!");
};

main();
