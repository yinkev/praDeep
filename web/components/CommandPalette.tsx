"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { COMMANDS, executeCommand } from "@/lib/commands"
import { 
  Search, 
  History, 
  BarChart2, 
  Workflow, 
  Brain, 
  Database, 
  Book, 
  HelpCircle, 
  Lightbulb, 
  Settings,
  Terminal,
  FileText
} from "lucide-react"

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  React.useEffect(() => {
    const onCommandPaletteEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ action?: "toggle" | "open" | "close" }>
      const action = customEvent.detail?.action ?? "toggle"

      setOpen((prev) => {
        if (action === "open") return true
        if (action === "close") return false
        return !prev
      })
    }

    window.addEventListener("opentutor:command-palette", onCommandPaletteEvent)
    return () => window.removeEventListener("opentutor:command-palette", onCommandPaletteEvent)
  }, [])

  const runCommand = React.useCallback(
    (commandId: string) => {
      setOpen(false)
      executeCommand(commandId, { router })
    },
    [router]
  )

  // Mapping command IDs to icons
  const getIcon = (cmd: typeof COMMANDS[number]) => {
    const Icon = cmd.icon
    return <Icon className="mr-2 h-4 w-4" />
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          {COMMANDS.slice(0, 5).map((cmd) => (
            <CommandItem
              key={cmd.id}
              onSelect={() => runCommand(cmd.id)}
              className="cursor-pointer"
            >
              {getIcon(cmd)}
              <span>{cmd.label}</span>
              <CommandShortcut>↵</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Tools">
          {COMMANDS.slice(5).map((cmd) => (
            <CommandItem
              key={cmd.id}
              onSelect={() => runCommand(cmd.id)}
              className="cursor-pointer"
            >
              {getIcon(cmd)}
              <span>{cmd.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
