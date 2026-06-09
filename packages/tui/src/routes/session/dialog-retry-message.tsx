import { createMemo, onMount } from "solid-js"
import type { AssistantMessage, TextPart, ToolPart } from "@opencode-ai/sdk/v2"
import { useDialog, type DialogContext } from "../../ui/dialog"
import { DialogSelect, type DialogSelectOption } from "../../ui/dialog-select"
import { useSync } from "../../context/sync"
import { Locale } from "../../util/locale"

export function DialogRetryMessage(props: { sessionID: string; onSelect: (messageID: string) => void }) {
  const sync = useSync()
  const dialog = useDialog()

  onMount(() => {
    dialog.setSize("large")
  })

  const options = createMemo((): DialogSelectOption<string>[] => {
    const messages = sync.data.message[props.sessionID] ?? []
    return messages
      .filter((message): message is AssistantMessage => message.role === "assistant")
      .map((message) => {
        const parts = sync.data.part[message.id] ?? []
        const text = parts.find((part): part is TextPart => part.type === "text" && part.text.trim().length > 0)
        const tools = parts.filter((part): part is ToolPart => part.type === "tool")
        return {
          title: text?.text.replace(/\n/g, " ") || tools.map((part) => part.tool).join(", ") || message.id,
          value: message.id,
          description: `${message.providerID}/${message.modelID}`,
          footer: `${Locale.time(message.time.created)} · ${message.finish ?? (message.error ? "error" : "incomplete")}`,
        }
      })
      .toReversed()
  })

  return (
    <DialogSelect
      title="Retry From Message"
      placeholder="Search assistant messages"
      options={options()}
      onSelect={(option) => props.onSelect(option.value)}
    />
  )
}

DialogRetryMessage.show = (dialog: DialogContext, sessionID: string) => {
  return new Promise<string | null>((resolve) => {
    dialog.replace(
      () => (
        <DialogRetryMessage
          sessionID={sessionID}
          onSelect={(messageID) => {
            resolve(messageID)
            dialog.clear()
          }}
        />
      ),
      () => resolve(null),
    )
  })
}
