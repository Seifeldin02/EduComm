import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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
    autoTable: (options: AutoTableOptions) => void;
    lastAutoTable: { finalY: number };
  }
}

// Helper function to create a jsPDF instance with autoTable
export const createPDFWithAutoTable = (): jsPDF => {
  const doc = new jsPDF();

  // Manually attach autoTable to the instance with proper context
  (doc as any).autoTable = (options: any) => {
    return autoTable(doc, options);
  };

  return doc;
};

// Re-export jsPDF for convenience
export { jsPDF };
