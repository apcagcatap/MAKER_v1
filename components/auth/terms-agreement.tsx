"use client";

import { useState } from "react";
import { TermsManager } from "@/lib/services/TermsManager";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TermsOfService } from "@/components/auth/terms-of-service";

// We can instantiate the manager here or pass data via props. 
// Since the manager is isomorphic (pure TS), we can use it to get default text.
const terms = TermsManager.getInstance().getCurrentTerms();

interface TermsAgreementProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  error?: string;
}

export function TermsAgreement({ checked, onCheckedChange, error }: TermsAgreementProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="terms" 
          checked={checked} 
          onCheckedChange={(c) => onCheckedChange(c as boolean)} 
          name="termsAccepted"
        />
        <div className="grid gap-1.5 leading-none">
          <Label
            htmlFor="terms"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            I agree to the{" "}
            <span
              className="text-primary underline cursor-pointer hover:text-primary/80"
              onClick={(e) => {
                e.preventDefault();
                setIsOpen(true);
              }}
            >
              terms and conditions
            </span>
          </Label>
          {error && <p className="text-sm font-medium text-destructive">{error}</p>}
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogTitle className="sr-only">{terms.title}</DialogTitle>
          <TermsOfService />
          <div className="flex justify-end">
            <Button 
              onClick={() => {
                onCheckedChange(true);
                setIsOpen(false);
              }}
            >
              Accept & Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}