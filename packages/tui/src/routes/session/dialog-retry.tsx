import { createMemo, onMount } from "solid-js"
import { useSync } from "../../context/sync"
import { DialogSelect, type DialogSelectOption } from "../../ui/dialog-select"
import type { TextPart } from "@opencode-ai/sdk/v2"
import { Locale } from "../../util/locale"
import { useSDK } from "../../context/sdk"
import { useDialog, type DialogContext } from "../../ui/dialog"

export function DialogRetry(props: { sessionID: string }) {
  const sync = useSync()
  const dialog = useDialog()
  const sdk = useSDK()

  onMount(() => {
    dialog.setSize("large")
  })

  const options = createMemo((): DialogSelectOption<string>[] => {
    const messages = sync.data.message[props.sessionID] ?? []
    const result = [] as DialogSelectOption<string>[]

    const lastAssistant = messages.findLast((m) => m.role === "assistant")
    if (lastAssistant?.error) {
      result.push({
        title: "Last error",
        value: "",
        description: "Retry the last errored assistant message",
        category: "Quick",
        onSelect: async (ctx: DialogContext) => {
          await sdk.client.session.retry({ sessionID: props.sessionID })
          ctx.clear()
        },
      })
    }

    for (const message of [...messages].reverse()) {
      const parts = sync.data.part[message.id] ?? []
      if (message.role === "user") {
        const text = parts.find((p): p is TextPart => p.type === "text" && !p.synthetic)
        result.push({
          title: "User",
          value: "",
          description: text ? text.text.replace(/\n/g, " ").slice(0, 120) : "",
          footer: Locale.time(message.time.created),
          category: "Timeline",
          disabled: true,
        })
        continue
      }

      const toolCount = parts.filter((p) => p.type === "tool").length
      const text = parts.find((p): p is TextPart => p.type === "text" && !p.synthetic)
      const error = message.error ? " (error)" : ""
      const toolInfo = toolCount > 0 ? ` [${toolCount} tools]` : ""

      result.push({
        title: `Assistant${error}${toolInfo}`,
        value: message.id,
        description: text ? text.text.replace(/\n/g, " ").slice(0, 120) : "(no text output)",
        footer: Locale.time(message.time.created),
        category: "Timeline",
        onSelect: async (ctx: DialogContext) => {
          await sdk.client.session.retry({ sessionID: props.sessionID, messageID: message.id })
          ctx.clear()
        },
      })
    }

    return result
  })

  return <DialogSelect title="Retry from" options={options()} />
}
