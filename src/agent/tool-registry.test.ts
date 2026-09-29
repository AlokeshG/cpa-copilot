import { describe, expect, it } from "vitest";
import {
  TOOL_NAMES,
  executeTool,
  isAllowedTool,
  toolRegistry,
} from "./tool-registry";

describe("tool registry", () => {
  it("contains all 10 required tools", () => {
    expect(TOOL_NAMES).toHaveLength(10);

    expect(TOOL_NAMES).toEqual([
      "get_current_receipt",
      "get_receipt_details",
      "validate_cra_documentation",
      "validate_gst_hst_number",
      "calculate_eligible_itc",
      "classify_expense",
      "assign_gifi_code",
      "update_expense_classification",
      "request_human_review",
      "get_processing_status",
    ]);
  });

  it("registers every required tool", () => {
    for (const name of TOOL_NAMES) {
      expect(toolRegistry[name]).toBeDefined();
      expect(typeof toolRegistry[name]).toBe("function");
    }
  });

  it("allows only registered tools", () => {
    expect(isAllowedTool("get_current_receipt")).toBe(true);
    expect(isAllowedTool("calculate_eligible_itc")).toBe(true);
    expect(isAllowedTool("request_human_review")).toBe(true);

    expect(isAllowedTool("delete_database")).toBe(false);
    expect(isAllowedTool("execute_shell")).toBe(false);
    expect(isAllowedTool("unknown_tool")).toBe(false);
  });

  it("rejects a non-allowlisted tool", async () => {
    const result = await executeTool("execute_shell", { command: "dir" });

    expect(result).toEqual({
      success: false,
      result: null,
      error: "Tool 'execute_shell' is not allowlisted.",
    });
  });

  it("can execute an allowlisted tool", async () => {
    const result = await executeTool("validate_gst_hst_number", {
      gstHstNumber: "123456789RT0001",
    });

    expect(result).toMatchObject({
      success: true,
    });
  });
});