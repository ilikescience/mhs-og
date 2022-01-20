const chromium = require("chrome-aws-lambda");
const puppeteer = require("puppeteer-core");
const { builder } = require("@netlify/functions");
const fs = require("fs").promises;

exports.handler = builder(async function (event, context) {
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: { height: 675, width: 1200 },
    // when running locally, use local chrome
    executablePath:
      process.env.EXCECUTABLE_PATH || (await chromium.executablePath),
    headless: chromium.headless,
  });

  let htmlPage = (
    await fs.readFile(require.resolve(`./template.html`))
  ).toString();

  const page = await browser.newPage();

  await page.setContent(htmlPage);
  const screenshot = await page.screenshot();

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "image/png",
    },
    body: screenshot.toString("base64"),
    isBase64Encoded: true,
  };
});
