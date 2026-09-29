import { describe, expect, it } from "vitest";
import {
  getCurrentReceipt,
  getReceiptDetails,
} from "./receipt-service";

describe("Receipt service", () => {
  it("gets Receipt A by ID", async () => {
    const receipt = await getReceiptDetails(
      "receipt-staples-2026-09-18",
    );

    expect(receipt).not.toBeNull();
    expect(receipt?.vendorName).toBe("Staples Canada");
    expect(receipt?.subtotal).toBe(82);
    expect(receipt?.taxAmount).toBe(4.1);
    expect(receipt?.totalAmount).toBe(86.1);
  });

  it("gets Receipt B by ID", async () => {
    const receipt = await getReceiptDetails(
      "receipt-restaurant-abc-2026-09",
    );

    expect(receipt).not.toBeNull();
    expect(receipt?.vendorName).toBe("Restaurant ABC");
    expect(receipt?.taxAmount).toBe(12);
  });

  it("gets Receipt C by ID", async () => {
    const receipt = await getReceiptDetails(
      "receipt-unknown-vendor-2026-09",
    );

    expect(receipt).not.toBeNull();
    expect(receipt?.vendorName).toBe("Unknown Vendor");
    expect(receipt?.gstHstNumber).toBeNull();
  });

  it("gets Receipt D by ID", async () => {
    const receipt = await getReceiptDetails(
      "receipt-cash-deposit-2026-09",
    );

    expect(receipt).not.toBeNull();
    expect(receipt?.vendorName).toBe("Cash Deposit");
    expect(receipt?.totalAmount).toBe(5000);
  });

  it("returns null for an unknown receipt", async () => {
    const receipt = await getReceiptDetails("receipt-does-not-exist");

    expect(receipt).toBeNull();
  });

  it("gets the current receipt when no ID is supplied", async () => {
    const receipt = await getCurrentReceipt();

    expect(receipt).not.toBeNull();
    expect(receipt?.id).toBeDefined();
  });
});