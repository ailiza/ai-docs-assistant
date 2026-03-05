import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const client = new Anthropic();

// Read all markdown files from the docs folder
function readDocs() {
  const docsFolder = "./docs";
  const files = fs.readdirSync(docsFolder);
  const docs = [];

  for (const file of files) {
    if (file.endsWith(".md")) {
      const content = fs.readFileSync(path.join(docsFolder, file), "utf-8");
      
      // Split the doc into chunks of ~500 characters
      // We chunk because embedding one giant doc is less useful
      // than embedding smaller focused pieces
      const chunks = splitIntoChunks(content, 500);
      
      for (const chunk of chunks) {
        docs.push({
          filename: file,
          text: chunk,
        });
      }
    }
  }

  return docs;
}

// Split text into smaller chunks
function splitIntoChunks(text, chunkSize) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;
    
    // Try to break at a newline so we don't cut mid-sentence
    if (end < text.length) {
      const newlineIndex = text.lastIndexOf("\n", end);
      if (newlineIndex > start) {
        end = newlineIndex;
      }
    }

    chunks.push(text.slice(start, end).trim());
    start = end;
  }

  return chunks.filter((chunk) => chunk.length > 0);
}

// Convert text to a vector using Anthropic's embedding model
async function embedText(text) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Convert this text to a search embedding. Respond with ONLY a JSON array of 16 numbers between -1 and 1 that represent the semantic meaning of this text. No explanation, just the array.
        
Text: ${text}`,
      },
    ],
  });

  const text_response = response.content[0].text.trim();
  return JSON.parse(text_response);
}

// Calculate how similar two vectors are (cosine similarity)
function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// Main function - read docs, embed them, save to a JSON file
async function main() {
  console.log("Reading docs...");
  const docs = readDocs();
  console.log(`Found ${docs.length} chunks across all docs`);

  console.log("Embedding chunks...");
  const embeddings = [];

  for (const doc of docs) {
    console.log(`Embedding: ${doc.filename} - "${doc.text.slice(0, 50)}..."`);
    const vector = await embedText(doc.text);
    embeddings.push({
      filename: doc.filename,
      text: doc.text,
      vector: vector,
    });
  }

  // Save everything to a JSON file
  fs.writeFileSync("embeddings.json", JSON.stringify(embeddings, null, 2));
  console.log(`Done! Saved ${embeddings.length} embeddings to embeddings.json`);
}

main();
