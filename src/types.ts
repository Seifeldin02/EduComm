import { Timestamp } from "firebase/firestore"; // Import Firebase Timestamp type

export type Group = {
  id: string;
  name: string;
  description: string;
  createdAt: Timestamp; // Use Firebase Timestamp type
  createdBy?: string; // Optional field for the creator's ID
};
