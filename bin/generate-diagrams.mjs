#!/usr/bin/env node
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const reportsDir = path.join(__dirname, "..", "docs", "report");
const diagramsDir = path.join(reportsDir, "diagrams");

// Ensure diagrams directory exists
fs.ensureDirSync(diagramsDir);

const diagrams = [
  "usecase.puml",
  "classdiagram.puml",
  "activity.puml",
  "sequence.puml",
  "component.puml",
];

console.log("Generating PlantUML diagrams...\n");

async function generateDiagrams() {
  for (const diagram of diagrams) {
    const inputFile = path.join(diagramsDir, diagram);
    const outputPng = path.join(diagramsDir, diagram.replace(".puml", ".png"));
    const diagramName = diagram.replace(".puml", "");

    try {
      console.log(`Converting ${diagram}...`);

      // Read PlantUML source
      const source = fs.readFileSync(inputFile, "utf8");
      await renderWithKroki(source, outputPng);

      const stats = fs.statSync(outputPng);
      console.log(`✓ Generated ${diagramName}.png (${stats.size} bytes)\n`);
    } catch (error) {
      console.error(`✗ Failed to generate ${diagramName}.png`);
      console.error(`  Error: ${error.message}\n`);
    }
  }

  console.log("✓ Diagram generation completed!");
}

function renderWithKroki(source, filepath) {
  return new Promise((resolve, reject) => {
    const request = https.request(
      {
        hostname: "kroki.io",
        path: "/plantuml/png",
        method: "POST",
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Length": Buffer.byteLength(source, "utf8"),
        },
      },
      (response) => {
        if (response.statusCode !== 200) {
          let body = "";
          response.setEncoding("utf8");
          response.on("data", (chunk) => {
            body += chunk;
          });
          response.on("end", () => {
            reject(new Error(`HTTP ${response.statusCode}: ${body || response.statusMessage}`));
          });
          return;
        }

        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => {
          fs.writeFileSync(filepath, Buffer.concat(chunks));
          resolve();
        });
      }
    );

    request.on("error", reject);
    request.write(source, "utf8");
    request.end();
  });
}

generateDiagrams().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
