# Ephemeral Chat & Draft Cache — Design Spec

**Date:** 2026-04-09
**Status:** Approved

## Overview

Enforce the business rule that a conversation only becomes a real server record once the user sends their first message. Until then the chat is "on the fly" — local UI state only. Additionally, persist unsent composer drafts in `localStorage` per chat (including the on-the-fly state), including the full runtime selection (source + LLM), so nothing is lost on refresh or navigation.

## Approach

Store-driven ephemeral state (Approach A). All changes live in four files. No new routes, no ID swapping, no URL params.

---

## Section 1 — Store changes (`useChatStore`)

**File:** `src/components/chat/store/useChatStore.ts`

Add to `ChatStoreState`:

```ts
pendingConversation: {
  databaseSourceId: string;
  llmConnectionId: string;
} | null;
```

Add to `ChatStoreActions`:

```ts
setPendingConversation(p: { databaseSourceId: string; llmConnectionId: string } | null): void;
clearPendingConversation(): void;
```

Default value: `pendingConversation: null`.

The picker's `onConfirmSelection` callback (in `ChatPageClient`) currently calls `createConversationMutation.mutate(...)`. It will instead call `setPendingConversation(selection)` + `closePicker()`. No API call on picker confirm.

---

## Section 2 — Draft cache hook

**File:** `src/components/chat/hooks/useDraftCache.ts` *(new)*

```ts
function useDraftCache(chatKey: string | "new"): {
  draft: string;
  setDraft: (text: string) => void;
  clearDraft: () => void;
}
```

### localStorage schema

| Key | Value |
|-----|-------|
| `kakaw:draft:{conversationId}` | `{ text: string }` |
| `kakaw:draft:new` | `{ text: string; databaseSourceId: string; llmConnectionId: string }` |

The `databaseSourceId` and `llmConnectionId` fields are only written for the `"new"` key. For existing conversations only `text` is stored.

### Behaviour

- Reads from localStorage on mount (keyed by `chatKey`)
- Writes on every `setDraft` call, debounced 300ms, to avoid thrashing
- `clearDraft` deletes the localStorage entry immediately (no debounce)
- JSON parse errors in localStorage are swallowed silently — treat as empty draft

### Restore on startup

`ChatPageClient` reads `kakaw:draft:new` on mount. If an entry exists and `pendingConversation` is currently `null`, it calls `setPendingConversation({ databaseSourceId, llmConnectionId })` to restore the full on-the-fly state across refreshes.

---

## Section 3 — Send flow (`ChatPageClient`)

**File:** `src/components/chat/ChatPageClient.tsx`

### New-chat send path

`handleSendMessage` gains a new first branch executed when `activeConversationId === null && pendingConversation !== null`:

1. Call `createConversation({ databaseSourceId, llmConnectionId, title: "New chat" })`
2. On success:
   - Add the new conversation to the `conversationsQueryKey` cache
   - Call `clearPendingConversation()`
   - Call `clearDraft("new")`
   - Push route to `/chat/:newId`
   - Continue streaming the message using the new conversation's ID
3. On failure: set composer error, leave `pendingConversation` intact (draft preserved in localStorage)

### Existing-chat send path

No logic change. Add one call at the end of a successful send: `clearDraft(activeConversationId)`.

### Redirect guard

The existing `useEffect` that redirects `/chat` → first conversation is guarded:

```ts
useEffect(() => {
  if (!activeConversationId && !pendingConversation && conversationsQuery.data?.length) {
    router.replace("/chat/" + conversationsQuery.data[0].id);
  }
}, [activeConversationId, pendingConversation, conversationsQuery.data, router]);
```

When `pendingConversation` is set, the redirect is skipped so the on-the-fly state lives at `/chat`.

---

## Section 4 — Composer & UI wiring

**Files:** `src/components/chat/ChatPageClient.tsx`, `src/components/chat/composer/ChatComposer.tsx`

### Draft sync in `ChatComposer`

`chatKey` is derived as `activeConversationId ?? "new"` and passed as a prop.

Two `useEffect`s:
1. On `chatKey` change: read draft from localStorage, call `setComposerInput(draft.text ?? "")`
2. On `composerInput` change: call `setDraft(composerInput)` (hook debounces the write)

### Enabled condition

`ChatComposer` is currently disabled when `!activeConversation`. New condition:

```ts
const isComposerEnabled = Boolean(activeConversation) || Boolean(pendingConversation);
```

Disabled states and loading states remain unchanged for existing conversations.

### Placeholder text

When `pendingConversation` is set (no real conversation), resolve labels from `chatOptionsQuery.data`:

```ts
const pendingSource = chatOptionsQuery.data?.databaseSources.find(s => s.id === pendingConversation.databaseSourceId);
const pendingLlm = chatOptionsQuery.data?.llmConnections.find(c => c.id === pendingConversation.llmConnectionId);
// placeholder: `Ask about {pendingSource.label} using {pendingLlm.model}...`
```

### `ChatConnectionPicker` prop cleanup

`isCreatingConversation` prop is no longer needed (creation is deferred). Remove it from the picker and its call site.

---

## Files Touched

| File | Change |
|------|--------|
| `src/components/chat/store/useChatStore.ts` | Add `pendingConversation` state + actions |
| `src/components/chat/hooks/useDraftCache.ts` | New hook |
| `src/components/chat/ChatPageClient.tsx` | Send flow, redirect guard, draft wiring, picker callback |
| `src/components/chat/composer/ChatComposer.tsx` | Enabled condition, draft sync, `chatKey` prop |
