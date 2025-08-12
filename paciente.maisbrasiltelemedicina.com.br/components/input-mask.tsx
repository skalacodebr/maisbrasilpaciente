"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface InputMaskProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  mask?: string
}

const applyMask = (value: string, mask: string): string => {
  if (!mask) return value

  let maskedValue = ""
  let valueIndex = 0
  
  for (let i = 0; i < mask.length && valueIndex < value.length; i++) {
    if (mask[i] === "9") {
      if (/\d/.test(value[valueIndex])) {
        maskedValue += value[valueIndex]
        valueIndex++
      } else {
        break
      }
    } else {
      maskedValue += mask[i]
    }
  }

  return maskedValue
}

const removeMask = (value: string): string => {
  return value.replace(/\D/g, "")
}

const InputMask = React.forwardRef<HTMLInputElement, InputMaskProps>(
  ({ className, mask, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!mask) {
        onChange?.(e)
        return
      }

      const rawValue = removeMask(e.target.value)
      const maskedValue = applyMask(rawValue, mask)
      
      // Create a new event with the masked value
      const maskedEvent = {
        ...e,
        target: {
          ...e.target,
          value: maskedValue,
        },
      }
      
      onChange?.(maskedEvent as React.ChangeEvent<HTMLInputElement>)
    }

    return (
      <Input
        className={cn(className)}
        onChange={handleChange}
        ref={ref}
        {...props}
      />
    )
  }
)

InputMask.displayName = "InputMask"

export { InputMask }

// Common mask patterns
export const MASKS = {
  CPF: "999.999.999-99",
  CNPJ: "99.999.999/9999-99",
  PHONE: "(99) 99999-9999",
  CEP: "99999-999",
  DATE: "99/99/9999",
}