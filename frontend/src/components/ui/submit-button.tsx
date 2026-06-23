import React from "react";
import { Button, buttonVariants } from "./button";
import { useFormStatus } from "react-dom";
import { VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { LucideLoader } from "lucide-react";

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
	pendingText: string;
	isPending?: boolean;
	disabled?: boolean;
}

const SubmitButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{ className, variant, size, pendingText, isPending, disabled, ...props },
		ref
	) => {
		const { pending } = useFormStatus();

		let loading = isPending || pending;

		return (
			<Button
				type="submit"
				ref={ref}
				className={cn(buttonVariants({ variant, size, className }))}
				{...props}
				disabled={disabled || loading}
			>
				{loading && <LucideLoader className="mr-2 h-4 w-4 animate-spin" />}
				{loading ? pendingText : props.children}
			</Button>
		);
	}
);
SubmitButton.displayName = "Button";

export { SubmitButton };
