# RAGAnything MinerU Path Mapping Fix

## Issue
When creating a knowledge base, MinerU parsing failed with "Extracted 0 content blocks" despite MinerU successfully running.

## Root Cause
**Path mismatch between MinerU output and RAGAnything's expected path.**

| Component | Input Method | Output Directory |
|-----------|-------------|------------------|
| MinerU CLI | `-m auto` | `{file_stem}/hybrid_auto/` |
| RAGAnything `_read_output_files` | method="auto" | `{file_stem}/auto/` |

MinerU internally maps `auto` -> `hybrid_auto` for its hybrid VLM+pipeline approach, but RAGAnything wasn't aware of this mapping.

## Solution
Patched RAGAnything's `_read_output_files` method in:
```
.venv/lib/python3.12/site-packages/raganything/parser.py
```

### Code Change (lines 808-813)
```python
# Map method names to actual MinerU output directory names
# MinerU uses "hybrid_auto" directory when method is "auto"
method_to_dir = {
    "auto": "hybrid_auto",
}
output_method = method_to_dir.get(method, method)

file_stem_subdir = output_dir / file_stem
if file_stem_subdir.exists():
    md_file = file_stem_subdir / output_method / f"{file_stem}.md"
    json_file = file_stem_subdir / output_method / f"{file_stem}_content_list.json"
    images_base_dir = file_stem_subdir / output_method
```

## Important Notes

### Cache Issues
The fix won't take effect if old Python processes are still running. Must:
1. Kill ALL uvicorn processes: `pkill -9 -f uvicorn`
2. Clear Python cache: `find .venv -name "*.pyc" -path "*raganything*" -delete`
3. Restart backend fresh

### This is a Library Patch
This patch edits the installed `raganything` package. It will be overwritten if you:
- Reinstall raganything: `pip install --upgrade raganything`
- Rebuild the venv

**TODO:** Submit upstream fix to RAGAnything repo or maintain local fork.

## Verification
After fix, KB creation should show:
```
INFO: Parsing ... complete! Extracted 171 content blocks
```

## Date
2026-01-11

## Related Files
- `/Users/kyin/Projects/praDeep/.venv/lib/python3.12/site-packages/raganything/parser.py`
- `/Users/kyin/Projects/praDeep/src/knowledge/initializer.py`
