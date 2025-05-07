import { z } from 'zod';

// Base literal type that represents a variable assignment
export const LiteralSchema = z.object({
    name: z.string(),
    assignment: z.boolean()
});

export type Literal = z.infer<typeof LiteralSchema>;

// Schema for a successful response
export const PassedResponseSchema = z.object({
    result: z.literal('passed'),
    states: z.array(z.never()).length(0),
    violated_pbt: z.literal('')
});

// Schema for a failed response
export const FailedResponseSchema = z.object({
    result: z.literal('failed'),
    states: z.array(z.array(LiteralSchema)),
    violated_pbt: z.string()
});

// Combined schema for all possible responses
export const Z3ResponseSchema = z.discriminatedUnion('result', [
    PassedResponseSchema,
    FailedResponseSchema
]);

// Type for the Z3 response
export type Z3Response = z.infer<typeof Z3ResponseSchema>;

// Type guard function to check if a response is a failure
export const isFailedResponse = (response: Z3Response): response is z.infer<typeof FailedResponseSchema> => {
    return response.result === 'failed';
}; 