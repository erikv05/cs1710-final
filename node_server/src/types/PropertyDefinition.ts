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

const PropertyDefinitionSchema = z.object({
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

export const TextPropertyDefinitionSchema = PropertyDefinitionSchema.extend({
  textToFind: z.string(),
  lhs: z.array(z.array(LiteralSchema)),
  rhs: z.array(z.array(LiteralSchema)),
});
