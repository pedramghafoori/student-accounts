// scraper.js
const axios = require("axios");
const cheerio = require("cheerio");

async function scrapeRefundPolicy() {
  try {
    const { data: html } = await axios.get("https://www.lifeguardingacademy.com/about/refund-policy");
    const $ = cheerio.load(html);

    // Assume the refund policy table is the first table on the page.
    const table = $("table").first();
    
    // Extract headers from the first row.
    const headers = [];
    table.find("tr").first().find("td").each((i, elem) => {
      const headerText = $(elem).text().trim();
      headers.push(headerText);
    });
    console.log("Extracted headers:", headers);

    // Parse the subsequent rows.
    const rows = [];
    table.find("tr").slice(1).each((i, row) => {
      const rowData = [];
      $(row).find("td").each((j, cell) => {
        rowData.push($(cell).text().trim());
      });
      rows.push(rowData);
    });
    console.log("Extracted rows:", rows);

    // Map the data to objects.
    const refundRow = rows.find((row) => row[0].toLowerCase().includes("refund"));
    const rescheduleRow = rows.find((row) =>
      row[0].toLowerCase().includes("rescheduling")
    );

    const refundPolicy = {};
    const reschedulePolicy = {};

    if (refundRow) {
      for (let i = 1; i < headers.length && i < refundRow.length; i++) {
        refundPolicy[headers[i]] = refundRow[i];
      }
    }
    if (rescheduleRow) {
      for (let i = 1; i < headers.length && i < rescheduleRow.length; i++) {
        reschedulePolicy[headers[i]] = rescheduleRow[i];
      }
    }

    console.log("Constructed refundPolicy:", refundPolicy);
    console.log("Constructed reschedulePolicy:", reschedulePolicy);

    // Extract daysBeforeReschedule from the header containing "More than"
    const moreThanHeader = headers.find(header =>
      header.toLowerCase().includes("more than")
    );
    let daysBeforeReschedule = 2; // default if not found
    if (moreThanHeader) {
      const match = moreThanHeader.match(/(\d+)/);
      if (match) {
        daysBeforeReschedule = parseInt(match[1], 10);
      }
    }
    console.log("Extracted daysBeforeReschedule:", daysBeforeReschedule);

    return {
      policyText: table.text().trim(),
      refundPolicy,
      reschedulePolicy,
      daysBeforeReschedule,
    };
  } catch (err) {
    console.error("Error scraping refund policy:", err);
    return null;
  }
}

module.exports = scrapeRefundPolicy;