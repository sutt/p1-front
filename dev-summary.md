# Dev Summary
Looks at tasks and associated commit solutions generated each release.

### v0.2.1

### Example

| Task File | Contents (truncated) | Accepted SHA | Non-test Diffs | Test Diffs | Notes |
|------|-------------|---------|-------------|------------|-----------|
| [prepost-filter-decode.md](../.public-agdocs/specs/prepost-filter-decode.md) | Apply refactor of filter_tok logic to pre_accept_filter + post_accept_filter functions in src/main:main_decode. Allow main_decode to take into account same logic so decoded data matches input. Functions will be extended with additional details. | [960c697](https://github.com/sutt/innocuous/commit/960c697) | +2/-0 | n/a | simpler than anticipated. the fix on top was actually a problem with encoder logic being emulated. |
| [decode-accept-1.md](../.public-agdocs/specs/decode-accept-1.md) | Apply the accept_tok logic that was added to main_encode to main_decode. Use partial diff showing function usage. Allow main_decode to take into account same logic so decoded data matches input. Accept_tok will be extended with additional details. | [79a4c67](https://github.com/sutt/innocuous/commit/79a4c67) | +14/-0 | n/a | prompt uses the "previous diff pattern". fine solution, nothing too challenging. |
| [decode-branch.md](../.public-agdocs/specs/decode-branch.md) | Refactor decode_main function to handle situation where remaining_text may .startswith match with multiple eligible tokens. Need branching to check maxsize of first 2**chunk_size tokens after tok_filter. Apply hacky solution for now. | [cdabc98](https://github.com/sutt/innocuous/commit/cdabc98) | +48/-25 | n/a | phenomenal solution; implemented difficult concept in 1-shot. fix was only for an llm library bug the ai-coder couldn't have realized. |