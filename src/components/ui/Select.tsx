import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown } from "lucide-react"

import { cn } from "../../utils"

export interface SelectProps {
    value?: string
    defaultValue?: string
    onValueChange?: (value: string) => void
    onChange?: (e: any) => void
    options?: { value: string; label: string }[]
    placeholder?: string
    className?: string
    disabled?: boolean
    children?: React.ReactNode
}

export const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
    ({ className, options, placeholder, value, defaultValue, onValueChange, onChange, disabled, children, ...props }, ref) => {

        const EMPTY_VALUE = "__EMPTY__";

        const handleValueChange = (val: string) => {
            const finalVal = val === EMPTY_VALUE ? "" : val;
            if (onValueChange) onValueChange(finalVal)
            if (onChange) {
                onChange({ target: { value: finalVal } })
            }
        }

        // Parse children (e.g. <option>) to extract options if `options` is not provided
        let parsedOptions: { value: string; label: string }[] = options ? [...options] : []

        if (!options && children) {
            const extractNodes = (nodes: React.ReactNode) => {
                React.Children.forEach(nodes, (child: any) => {
                    if (React.isValidElement(child)) {
                        const element = child as React.ReactElement<any>;
                        if (element.type === 'option') {
                            parsedOptions.push({
                                value: element.props.value as string || "",
                                label: element.props.children as string || ""
                            })
                        } else if (element.type === React.Fragment) {
                            extractNodes(element.props.children)
                        } else if (Array.isArray(element)) {
                            extractNodes(element)
                        }
                    } else if (Array.isArray(child)) {
                        extractNodes(child)
                    }
                })
            }
            extractNodes(children)
        }

        // Sanitize options to handle empty string values
        parsedOptions = parsedOptions.map(opt => ({
            ...opt,
            value: opt.value === "" ? EMPTY_VALUE : opt.value
        }));

        return (
            <SelectPrimitive.Root
                value={value === "" ? EMPTY_VALUE : value}
                defaultValue={defaultValue === "" ? EMPTY_VALUE : defaultValue}
                onValueChange={handleValueChange}
                disabled={disabled}
            >
                <SelectPrimitive.Trigger
                    ref={ref}
                    className={cn(
                        "flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                        className
                    )}
                    {...props as any}
                >
                    <SelectPrimitive.Value placeholder={placeholder} />
                    <SelectPrimitive.Icon asChild>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                    </SelectPrimitive.Icon>
                </SelectPrimitive.Trigger>
                <SelectPrimitive.Portal>
                    <SelectPrimitive.Content
                        className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
                        position="popper"
                        sideOffset={4}
                    >
                        <SelectPrimitive.Viewport className="h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] p-1">
                            {parsedOptions.map((opt, i) => (
                                <SelectPrimitive.Item
                                    key={`${opt.value}-${i}`}
                                    value={opt.value}
                                    className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                                >
                                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                                        <SelectPrimitive.ItemIndicator>
                                            <Check className="h-4 w-4" />
                                        </SelectPrimitive.ItemIndicator>
                                    </span>
                                    <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                                </SelectPrimitive.Item>
                            ))}
                        </SelectPrimitive.Viewport>
                    </SelectPrimitive.Content>
                </SelectPrimitive.Portal>
            </SelectPrimitive.Root>
        )
    }
)
Select.displayName = "Select"
