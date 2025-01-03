#!/bin/node

import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { executablePath } from 'puppeteer'

async function main() {
  let url = process.argv[2]

  const puppeteerExtra = puppeteer.use(StealthPlugin());
  const browser = await puppeteerExtra.launch({
    headless: true,
    executablePath: executablePath(),
  });

  const page = await browser.newPage();

  try {
    const response = await page.goto(url);

    // Check if blocked by Cloudflare
    if (response?.status() === 403) {
      throw new Error(
        "Request blocked by Cloudflare protection. Please try again later.",
      );
    }

    await page.waitForSelector("body");

    const jsonContent = await page.evaluate(() => {
      const bodyElement = document.querySelector("body");
      if (!bodyElement || !bodyElement.textContent) {
        throw new Error("Unable to fetch data");
      }

      return JSON.parse(bodyElement.textContent);
    });

    await browser.close();
    console.log(JSON.stringify(jsonContent))
  } catch (error) {
    await browser.close();
    if (error instanceof Error && error.message.includes("Cloudflare")) {
      throw error; // Re-throw Cloudflare-specific error
    }
    console.error("Error getting data:", error);
  }

}

main()
