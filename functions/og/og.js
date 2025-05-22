const { builder } = require('@netlify/functions');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const fs = require('fs');
const path = require('path');

async function handler(event, context) {
  let browser = null;
  console.log('Function started.'); // Essential: Marks the beginning of an invocation

  try {
    // --- Parameter Parsing ---
    const queryParams = event.queryStringParameters || {};
    let headline = queryParams.headline;
    let subhead = queryParams.subhead;
    const defaultHeadline = 'Default Headline';
    const defaultSubhead = 'Default Subhead';

    // Fallback for environments where queryStringParameters might not be auto-populated
    if (
      (headline === undefined || subhead === undefined) &&
      event.rawQuery &&
      event.rawQuery.length > 0
    ) {
      try {
        const parsedRawQuery = new URLSearchParams(event.rawQuery);
        if (headline === undefined && parsedRawQuery.has('headline')) {
          headline = parsedRawQuery.get('headline');
        }
        if (subhead === undefined && parsedRawQuery.has('subhead')) {
          subhead = parsedRawQuery.get('subhead');
        }
      } catch (e) {
        console.warn('Could not parse event.rawQuery:', e.message); // Warn on parsing error
      }
    }

    headline = headline || defaultHeadline;
    subhead = subhead || defaultSubhead;
    // Log the effective parameters being used - crucial for understanding output
    console.log(
      `Processing OG image for: Headline="${headline}", Subhead="${subhead}"`
    );

    // --- Prepare Font Data URL ---
    let fontDataUrl = '';
    const localFontPath = path.join(__dirname, '_fonts', 'inter_regular.woff2');
    try {
      if (fs.existsSync(localFontPath)) {
        const fontBuffer = fs.readFileSync(localFontPath);
        fontDataUrl = `data:font/woff2;base64,${fontBuffer.toString('base64')}`;
      } else {
        // Log an error if the critical font file is missing
        console.error(
          `Critical: Font file not found at ${localFontPath}. OG image will use fallback fonts.`
        );
      }
    } catch (e) {
      console.error(
        `Critical: Error processing font file ${localFontPath}:`,
        e.message
      );
    }

    // --- Puppeteer Launch Setup ---
    const detectedExecutablePath =
      process.env.EXCECUTABLE_PATH || (await chromium.executablePath());
    let launchOptions = {
      defaultViewport: { height: 675, width: 1200 },
      executablePath: detectedExecutablePath,
      headless: chromium.headless,
      pipe: true,
    };

    let argsToUse = chromium.args.filter((arg) => arg !== "--headless='shell'"); // General safeguard
    // This conditional logic is key for local development vs. deployed environment
    const isSystemChromeMac = detectedExecutablePath
      .toLowerCase()
      .includes('/applications/google chrome.app');
    // Add other OS checks here if you develop on Windows/Linux with local Chrome
    const isLikelySystemChrome = isSystemChromeMac;

    if (process.env.NETLIFY_DEV === 'true' && isLikelySystemChrome) {
      console.warn(
        'Local dev with system Chrome: Using MINIMAL args for compatibility.'
      );
      argsToUse = ['--no-sandbox', '--disable-setuid-sandbox'];
    } else {
      // In production (or when not using local system Chrome for dev), use sparticuz args
      // console.log("Using default args from @sparticuz/chromium."); // Optional: Can be noisy in prod
    }
    launchOptions.args = argsToUse;
    // console.log(`Launching browser. Headless: ${launchOptions.headless}. Args count: ${argsToUse.length}.`); // Optional: Can be noisy

    browser = await puppeteer.launch(launchOptions);
    // console.log("Browser launched."); // Optional

    const page = await browser.newPage();
    // console.log("New page created."); // Optional

    let htmlTemplate;
    try {
      htmlTemplate = fs
        .readFileSync(path.join(__dirname, 'template.html'))
        .toString();
    } catch (fileError) {
      console.error('Fatal: Error reading template.html:', fileError.message);
      // Ensure browser is closed even if template read fails before Puppeteer interaction
      if (browser) {
        await browser.close();
      }
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: 'Failed to read HTML template file.',
          error: fileError.message,
        }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    let populatedHtml = htmlTemplate
      .replace(new RegExp('{headline}', 'g'), headline)
      .replace(new RegExp('{subhead}', 'g'), subhead);

    if (fontDataUrl) {
      const fontFaceStyle = `
            <style type="text/css">
              @font-face {
                font-family: 'Inter'; /* Must match the name used in your template.html CSS */
                src: url('${fontDataUrl}') format('woff2');
                font-weight: normal;
                font-style: normal;
              }
            </style>`;
      if (populatedHtml.includes('</head>')) {
        populatedHtml = populatedHtml.replace(
          '</head>',
          `${fontFaceStyle}</head>`
        );
      } else {
        populatedHtml = fontFaceStyle + populatedHtml;
        console.warn(
          'No </head> tag found in template.html. Prepended @font-face style; consider adding <head> tags for optimal placement.'
        );
      }
    }

    if (
      htmlTemplate === populatedHtml &&
      fontDataUrl &&
      (headline !== defaultHeadline || subhead !== defaultSubhead)
    ) {
      // This condition might need refinement if font injection changes HTML length but not placeholders
      console.warn(
        'Placeholders {headline}/{subhead} might not have been found/replaced, or font already matched default (if no params passed).'
      );
    }

    // console.log("Setting page content..."); // Optional
    await page.setContent(populatedHtml, { waitUntil: 'networkidle0' });
    // console.log("Page content set."); // Optional

    const screenshot = await page.screenshot();
    // console.log("Screenshot taken."); // Optional

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'image/png' },
      body: screenshot.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error('Error in handler:', error.message); // Essential error log
    if (error.stack) {
      console.error('Stack trace for handler error:', error.stack); // Essential for debugging
    }
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error generating screenshot.',
        error: error.message, // Provide a user-friendly error
      }),
      headers: { 'Content-Type': 'application/json' },
    };
  } finally {
    if (browser) {
      // console.log("Closing browser..."); // Optional
      await browser.close();
      // console.log("Browser closed."); // Optional
    }
    console.log('Function finished.'); // Essential: Marks the end of an invocation
  }
}

exports.handler = builder(handler);
