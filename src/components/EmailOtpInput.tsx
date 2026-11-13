import { useRef } from "react";
import type { ClipboardEvent, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

interface EmailOtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  autoFocus?: boolean;
}

export function EmailOtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  hasError = false,
  autoFocus = true,
}: EmailOtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  function setDigit(index: number, digit: string) {
    const chars = value.split("");
    chars[index] = digit;
    const next = chars.join("").slice(0, length);
    onChange(next);
    if (index < length - 1 && digit) {
      refs.current[index + 1]?.focus();
    }
    if (next.length === length) {
      onComplete?.(next);
    }
  }

  function handleChange(index: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    if (!digit) return;
    setDigit(index, digit);
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      event.preventDefault();
      const chars = value.split("");
      if (chars[index]) {
        chars[index] = "";
        onChange(chars.join("").slice(0, length));
      } else if (index > 0) {
        chars[index - 1] = "";
        onChange(chars.join("").slice(0, length));
        refs.current[index - 1]?.focus();
      }
      return;
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      refs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault();
      refs.current[index + 1]?.focus();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
    if (pasted.length === length) {
      onComplete?.(pasted);
    }
  }

  return (
    <div
      className="flex items-center justify-center gap-2 sm:gap-3"
      onPaste={handlePaste}
    >
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(element) => {
            refs.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          value={value[index] ?? ""}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          aria-label={`${index + 1}`}
          className={cn(
            "h-14 w-11 rounded-2xl border bg-white text-center font-display text-2xl font-extrabold text-foreground outline-none transition-all sm:h-16 sm:w-14 sm:text-3xl",
            hasError
              ? "border-danger/60 focus:border-danger focus:ring-2 focus:ring-danger/15"
              : "border-input focus:border-primary focus:ring-2 focus:ring-primary/15",
            disabled && "opacity-50",
          )}
        />
      ))}
    </div>
  );
}
