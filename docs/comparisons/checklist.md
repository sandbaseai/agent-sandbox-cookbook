# Compatibility Checklist

Use this checklist when adding or updating a vendor runtime.

## Tool Schema

- [ ] Supports named tools
- [ ] Supports structured input schema
- [ ] Supports required fields
- [ ] Supports nested objects
- [ ] Supports enum-like constraints
- [ ] Can describe tool behavior to the model

## Tool Execution

- [ ] Tool handler runs in user code
- [ ] Tool handler can call remote HTTP sandbox
- [ ] Tool handler can return structured JSON
- [ ] Tool handler can return structured errors
- [ ] Tool calls have stable IDs
- [ ] Multiple tool calls can be handled in one turn

## Sandbox Controls

- [ ] Timeout can be enforced
- [ ] Max output size can be enforced
- [ ] Network allowlist can be enforced
- [ ] CPU or fuel limit can be enforced
- [ ] Tool cancellation is supported or documented
- [ ] Unsafe requests can be blocked before execution

## Runtime State

- [ ] Session ID can be passed into tool calls
- [ ] Trace ID can be passed into tool calls
- [ ] Runtime has a documented state model
- [ ] Long-running task state is supported or documented

## Observability

- [ ] Model call can be traced
- [ ] Tool call can be traced
- [ ] Sandbox request can be traced
- [ ] Errors include enough context for debugging
- [ ] Logs avoid secrets by default

## Developer Experience

- [ ] Local development works
- [ ] Remote deployment path is documented
- [ ] Minimal example runs in under 10 minutes
- [ ] Failure cases are easy to reproduce
- [ ] Required accounts and credentials are documented
