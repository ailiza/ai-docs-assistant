import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const client = new Anthropic();

// Load the embeddings we created with embed.js
const embeddings = JSON.parse(fs.readFileSync("./embeddings.json", "utf-8"));

// Convert a query to a vector using Claude
async function embedQuery(query) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Convert this text to a search embedding. Respond with ONLY a JSON array of 16 numbers between -1 and 1 that represent the semantic meaning of this text. No explanation, just the array.
        
Text: ${query}`,
      },
    ],
  });

  return JSON.parse(response.content[0].text.trim());
}

// Calculate how similar two vectors are
function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// Find the most relevant doc chunks for a query
async function searchDocs(query, topK = 3) {
  const queryVector = await embedQuery(query);

  // Score every chunk against the query
  const scored = embeddings.map((doc) => ({
    filename: doc.filename,
    text: doc.text,
    score: cosineSimilarity(queryVector, doc.vector),
  }));

  // Sort by score and return the top results
  return scored.sort((a, b) => b.score - a.score).slice(0, topK);
}

// Create the MCP server
const server = new McpServer({
  name: "ai-docs-assistant",
  version: "1.0.0",
});

// Define the search_docs tool
server.tool(
  "search_docs",
  "searches the internal documentation for a given query and returns the most relevant sections",
  { query: z.string() },
  async ({ query }) => {
    console.error(`Searching for: "${query}"`);
    const results = await searchDocs(query);

    const formatted = results
      .map((r) => `[${r.filename}] (score: ${r.score.toFixed(2)})\n${r.text}`)
      .join("\n\n---\n\n");

    return {
      content: [
        {
          type: "text",
          text: formatted,
        },
      ],
    };
  }
);

// Start the server
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("MCP server running!");
