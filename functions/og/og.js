const { builder } = require("@netlify/functions");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const fs = require("fs");
const path = require("path"); // Required for constructing file paths

async function handler(event, context) {
    let browser = null;
    console.log("Function started.");

    try {
        // --- Load Custom Font ---
        // Construct the absolute path to your font file.
        // This assumes your function file (e.g., og.js) is in the 'functions/og/' directory.
        const fontPath = path.join(__dirname, '_fonts', 'inter_regular.woff2');
        console.log(`Attempting to load font from local path: ${fontPath}`);
        try {
            // Check if file exists before attempting to load - helps debugging
            if (fs.existsSync(fontPath)) {
                await chromium.font(fontPath);
                console.log(`Font "${fontPath}" loaded successfully via chromium.font().`);
            } else {
                console.error(`Font file not found at: ${fontPath}. Please check the path and ensure it's deployed.`);
                // Decide if this is a fatal error or if you want to proceed with default fonts
            }
        } catch (fontError) {
            console.error("Error loading font via chromium.font():", fontError.message);
            // Log the full error for more details if needed: console.error(fontError);
        }
        // --- End Load Custom Font ---

        const queryParams = event.queryStringParameters || {};
        let headline = queryParams.headline;
        let subhead = queryParams.subhead;
        const defaultHeadline = "Default Headline";
        const defaultSubhead = "Default Subhead";

        if ((headline === undefined || subhead === undefined) && event.rawQuery && event.rawQuery.length > 0) {
            console.log(`Query params not fully found in queryStringParameters, attempting to parse event.rawQuery: "${event.rawQuery}"`);
            try {
                const parsedRawQuery = new URLSearchParams(event.rawQuery);
                if (headline === undefined && parsedRawQuery.has('headline')) {
                    headline = parsedRawQuery.get('headline');
                }
                if (subhead === undefined && parsedRawQuery.has('subhead')) {
                    subhead = parsedRawQuery.get('subhead');
                }
            } catch (e) {
                console.error("Error parsing event.rawQuery:", e);
            }
        }

        headline = headline || defaultHeadline;
        subhead = subhead || defaultSubhead;
        console.log(`Processing request with Headline: "${headline}", Subhead: "${subhead}"`);

        const detectedExecutablePath = process.env.EXCECUTABLE_PATH || await chromium.executablePath();
        let launchOptions = {
            defaultViewport: { height: 630, width: 1200 },
            executablePath: detectedExecutablePath,
            headless: chromium.headless,
            pipe: true,
        };

        let argsToUse = chromium.args.filter(arg => arg !== "--headless='shell'");
        const isSystemChromeMac = detectedExecutablePath.toLowerCase().includes("/applications/google chrome.app");
        const isLikelySystemChrome = isSystemChromeMac;

        if (process.env.NETLIFY_DEV === 'true' && isLikelySystemChrome) {
            console.warn("Local dev with system Chrome: Using MINIMAL args for compatibility.");
            argsToUse = ['--no-sandbox', '--disable-setuid-sandbox'];
        } else {
            console.log("Using default args from @sparticuz/chromium (or filtered).");
        }
        launchOptions.args = argsToUse;
        console.log(`Launching browser. Headless: ${launchOptions.headless}. Args count: ${argsToUse.length}.`);

        browser = await puppeteer.launch(launchOptions);
        console.log("Browser launched.");

        const page = await browser.newPage();
        console.log("New page created.");

        let htmlTemplate;
        try {
            htmlTemplate = fs.readFileSync(path.join(__dirname, 'template.html')).toString();
            console.log("template.html read successfully.");
        } catch (fileError) {
            console.error("Error reading template.html:", fileError.message);
            return {
                statusCode: 500,
                body: JSON.stringify({ message: "Failed to read HTML template file.", error: fileError.message }),
                headers: { "Content-Type": "application/json" },
            };
        }

        const populatedHtml = htmlTemplate
            .replace(new RegExp('{headline}', 'g'), headline)
            .replace(new RegExp('{subhead}', 'g'), subhead);
        
        if (htmlTemplate === populatedHtml && (headline !== defaultHeadline || subhead !== defaultSubhead)) {
             console.warn("Placeholders {headline} or {subhead} might not have been found in template.html for replacement, or query params were not effective.");
        }

        console.log("Setting page content with populated HTML...");
        await page.setContent(populatedHtml, { waitUntil: 'networkidle0' });
        console.log("Page content set.");

        const screenshot = await page.screenshot();
        console.log("Screenshot taken.");

        return {
            statusCode: 200,
            headers: { "Content-Type": "image/png" },
            body: screenshot.toString("base64"),
            isBase64Encoded: true,
        };
    } catch (error) {
        console.error("Error in handler:", error.message);
        if (error.stack) {
            console.error("Stack trace:", error.stack);
        }
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Error generating screenshot.", error: error.message }),
            headers: { "Content-Type": "application/json" },
        };
    } finally {
        if (browser) {
            console.log("Closing browser...");
            await browser.close();
            console.log("Browser closed.");
        }
    }
}

exports.handler = builder(handler);