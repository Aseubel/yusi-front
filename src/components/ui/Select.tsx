import { cn } from '../../utils'
import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    options?: { value: string; label: string }[]
    placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, options, placeholder, children, ...rest }, ref) => {
        return (
            <div className="relative">
                <select
                    ref={ref}
                    className={cn(
                        "flex h-10 w-full appearance-none rounded-xl border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        "transition-colors duration-200",
                        "cursor-pointer",
                        className
                    )}
                    {...rest}
                >
                    {placeholder && <option value="">{placeholder}</option>}
                    {options ? options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    )) : children}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
        )
    }
)
Select.displayName = 'Select'
