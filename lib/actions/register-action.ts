"use server";

import { z } from "zod";
import { TermsManager } from "@/lib/services/TermsManager";

// Define the schema here or in a shared schema file
const registrationSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must accept the Terms and Conditions." }),
  }),
});

export type RegistrationState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

export async function registerUser(prevState: RegistrationState, formData: FormData): Promise<RegistrationState> {
  // Extract data
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
    termsAccepted: formData.get("termsAccepted") === "on", // Checkbox sends "on" if checked
  };

  const validatedFields = registrationSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Please fix the errors below.",
    };
  }

  // Simulate Database Call
  const termsVersion = TermsManager.getInstance().getCurrentTerms().version;
  console.log(`Registering user ${validatedFields.data.email} with terms version ${termsVersion}`);

  // Return success
  return { success: true, message: "Registration successful!" };
}