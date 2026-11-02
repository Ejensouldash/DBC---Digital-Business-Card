import { z } from "zod";

// "Main card", "Spare". Empty clears the label.
export const cardLabelSchema = z
  .string()
  .trim()
  .max(50, "tooLong")
  .transform((value) => value || null);
