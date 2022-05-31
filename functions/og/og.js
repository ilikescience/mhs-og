const chromium = require("chrome-aws-lambda");
const puppeteer = require("puppeteer-core");
const { builder } = require("@netlify/functions");
const fs = require("fs");

const serif = fs
    .readFileSync(`${__dirname}/_fonts/charter_regular.woff2`)
    .toString("base64");

const sans = fs
    .readFileSync(`${__dirname}/_fonts/inter_regular.woff2`)
    .toString("base64");

const getCSS = () => `
  @font-face {
    font-family: 'Inter';
    font-style:  normal;
    font-weight: bold;
    src: url(data:font/woff2;charset=utf-8;base64,${sans}) format('woff2');
  }
`;

exports.handler = builder(async function (event, context) {
    const { ...params } = Object.fromEntries(
        event.path
            .split("/")
            .filter((p) => p.includes("="))
            .map(decodeURIComponent)
            .map((s) => s.split("=", 2))
    );
    const browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: { height: 675, width: 1200 },
        // when running locally, use local chrome
        executablePath:
            process.env.EXCECUTABLE_PATH || (await chromium.executablePath),
        headless: chromium.headless,
    });

    let htmlPage = fs
        .readFileSync(`${__dirname}/template.html`)
        .toString()
        .replace("{CSS}", getCSS())
        .replace("{SEED}", params[0]);

    for (const k in params) {
        htmlPage = htmlPage.replace(`{${k}}`, params[k]);
    }

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
