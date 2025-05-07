import { z } from 'zod';

// Base PBT Assertion interface
export interface PBTAssertion {
  name: string;
  lhs: any[][];
  rhs: any[][];
}

// Text PBT Assertion interface
export interface TextPBTAssertion extends PBTAssertion {
  textToFind: string;
}

// Label PBT Assertion interface
export interface LabelPBTAssertion extends PBTAssertion {
  labelToFind: string;
}

// Schema for Text Assertion
const TextPBTAssertionSchema = z.object({
  name: z.string(),
  textToFind: z.string(),
  lhs: z.array(z.array(z.object({
    name: z.string(),
    assignment: z.boolean()
  }))),
  rhs: z.array(z.array(z.object({
    name: z.string(),
    assignment: z.boolean()
  })))
});

// Schema for Label Assertion
const LabelPBTAssertionSchema = z.object({
  name: z.string(),
  labelToFind: z.string(),
  lhs: z.array(z.array(z.object({
    name: z.string(),
    assignment: z.boolean()
  }))),
  rhs: z.array(z.array(z.object({
    name: z.string(),
    assignment: z.boolean()
  })))
});

// Union schema for all PBT assertion types
export const PBTAssertionSchema = z.union([
  TextPBTAssertionSchema,
  LabelPBTAssertionSchema
]);

export const LiteralSchema = z.object({
  name: z.string(),
  assignment: z.boolean(),
});

export const NodeAPIRequestSchema = z.object({
  filepath: z.string(),
  useStatefulTesting: z.boolean().optional().default(true),
  textAssertions: z.array(PBTAssertionSchema)
});

export type NodeAPIRequest = z.infer<typeof NodeAPIRequestSchema>;