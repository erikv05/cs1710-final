import { z } from 'zod';

export interface PropertyDefinition {
  name: string;
}

const PropertyDefinitionSchema = z.object({
  name: z.string(),
})

// Find textToFind anywhere in the page
export interface TextPropertyDefinition extends PropertyDefinition {
  name: string;
  textToFind: string;
}

export const TextPropertyDefinitionSchema = PropertyDefinitionSchema.extend({
  textToFind: z.string(),
});