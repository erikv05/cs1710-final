import { z } from 'zod';

export interface Literal {
  name: string;
  assignment: boolean;
}

export interface PBTAssertion {
  name: string;
  lhs: Literal[][];
  rhs: Literal[][];
}

const PBTAssertionSchema = z.object({
  name: z.string(),
})

// Find textToFind anywhere in the page
export interface TextPBTAssertion extends PBTAssertion {
  name: string;
  textToFind: string;
  lhs: Literal[][];
  rhs: Literal[][];
}

export const LiteralSchema = z.object({
  name: z.string(),
  assignment: z.boolean(),
});

export const TextPBTAssertionSchema = PBTAssertionSchema.extend({
  name: z.string(),
  textToFind: z.string(),
  lhs: z.array(z.array(LiteralSchema)),
  rhs: z.array(z.array(LiteralSchema)),
});

export const NodeAPIRequestSchema = z.object({
  filepath: z.string(),
  textAssertions: z.array(TextPBTAssertionSchema),
})