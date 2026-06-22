import { describe, expect, test } from "bun:test"
import { LLMEvent, Usage } from "@opencode-ai/llm"
import { ProviderTransform } from "@/provider/transform"
import { DegradedReasoningTokenError, ReasoningTokenRetry } from "@/session/llm/reasoning-token-retry"

const usage = (reasoningTokens: number) =>
  new Usage({
    inputTokens: 10,
    outputTokens: 20,
    reasoningTokens,
    totalTokens: 30,
  })

describe("ReasoningTokenRetry.fromEvent", () => {
  test("returns degraded token error for configured reasoning token counts", () => {
    const result = ReasoningTokenRetry.fromEvent(
      LLMEvent.finish({ reason: "stop", usage: usage(516) }),
      {
        [ProviderTransform.DEGRADED_REASONING_TOKEN_RETRY]: true,
        [ProviderTransform.DEGRADED_REASONING_TOKEN_COUNTS]: [516],
      },
    )

    expect(result).toBeInstanceOf(DegradedReasoningTokenError)
    expect(result?.message).toBe("降智错误: reasoning token count 516 matched configured degraded counts [516]")
  })

  test("ignores non-matching counts and disabled retry", () => {
    expect(
      ReasoningTokenRetry.fromEvent(LLMEvent.finish({ reason: "stop", usage: usage(128) }), {
        [ProviderTransform.DEGRADED_REASONING_TOKEN_RETRY]: true,
        [ProviderTransform.DEGRADED_REASONING_TOKEN_COUNTS]: [516],
      }),
    ).toBeUndefined()

    expect(
      ReasoningTokenRetry.fromEvent(LLMEvent.finish({ reason: "stop", usage: usage(516) }), {
        [ProviderTransform.DEGRADED_REASONING_TOKEN_COUNTS]: [516],
      }),
    ).toBeUndefined()
  })
})
