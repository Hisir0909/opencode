import type { LLMEvent } from "@opencode-ai/llm"
import { ProviderTransform } from "@/provider/transform"

export class DegradedReasoningTokenError extends Error {
  constructor(input: { readonly tokens: number; readonly counts: ReadonlyArray<number> }) {
    super(`降智错误: reasoning token count ${input.tokens} matched configured degraded counts [${input.counts.join(", ")}]`)
    this.name = "DegradedReasoningTokenError"
  }
}

export function counts(options: Record<string, unknown>) {
  const value = options[ProviderTransform.DEGRADED_REASONING_TOKEN_COUNTS]
  if (!Array.isArray(value)) return []
  return value.filter((count): count is number => typeof count === "number" && Number.isFinite(count) && count >= 0)
}

export function fromEvent(event: LLMEvent, options: Record<string, unknown>) {
  if (options[ProviderTransform.DEGRADED_REASONING_TOKEN_RETRY] !== true) return undefined
  if (!("usage" in event)) return undefined
  if (typeof event.usage?.reasoningTokens !== "number") return undefined
  const configured = counts(options)
  if (!configured.includes(event.usage.reasoningTokens)) return undefined
  return new DegradedReasoningTokenError({ tokens: event.usage.reasoningTokens, counts: configured })
}

export * as ReasoningTokenRetry from "./reasoning-token-retry"
