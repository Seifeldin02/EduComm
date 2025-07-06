import { jsPDF } from "jspdf";
import "jspdf-autotable";

// Type declaration for autoTable
interface AutoTableOptions {
  head?: any[][];
  body?: any[][];
  startY?: number;
  theme?: string;
  headStyles?: any;
}

// Extend jsPDF type to include autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => void;
    lastAutoTable: { finalY: number };
  }
}

// Helper function to create a jsPDF instance with autoTable
export const createPDFWithAutoTable = (): jsPDF => {
  const doc = new jsPDF() as any;

  // Verify autoTable is available
  if (!doc.autoTable) {
    throw new Error("autoTable plugin not available");
  }

  return doc;
};

// Re-export jsPDF for convenience
export { jsPDF };
