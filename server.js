import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create the server
const server = new McpServer({
  name: "ai-docs-assistant",
  version: "1.0.0",
});

// Define our first tool
server.tool(
  "search_docs",                           // tool name
  "searches the documentation for a given query", // description the AI reads
  { query: z.string() },                   // input schema - expects a string called query
  async ({ query }) => {
    // For now we're just returning fake data
    // Later this will actually search our docs
    return {
      content: [
        {
          type: "text",
          text: `Here are the results for: "${query}". (This is a placeholder - real search coming soon!)`,
        },
      ],
    };
  }
);

// Start the server
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("MCP server running!");
