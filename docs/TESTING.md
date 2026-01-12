# praDeep Testing Guide

## Current Configuration

| Component | Value |
|-----------|-------|
| Frontend | http://localhost:3783 |
| Backend | http://localhost:8783 |
| LLM | gemini-3-flash-preview (via CLI Proxy 8317) |
| Embedding | Qwen3-VL-Embedding-8B (local MPS) |
| Dimensions | 2048 |

---

## Test 1: Knowledge Base Upload (Critical)

**Purpose:** Verify PDF processing and embedding generation work.

1. Click **Knowledge Bases** in sidebar
2. Click **Create New** or **+** button
3. Upload a small PDF (1-5 pages recommended for first test)
4. Watch for:
   - Upload progress
   - Processing status
   - Any error messages in UI

**Expected:** PDF appears in knowledge base list with "Ready" status.

**If it fails:** Check backend logs for embedding errors.

---

## Test 2: RAG Query (Critical)

**Purpose:** Verify retrieval + LLM generation pipeline.

1. Go to **Home**
2. Make sure **RAG** toggle is selected (not Web Search)
3. Select your knowledge base from dropdown (if available)
4. Type a question about your uploaded PDF content
5. Submit

**Expected:**
- Response with citations from the PDF
- Citations should be clickable/viewable

**If it fails:**
- Check if knowledge base was indexed
- Check CLI Proxy is running on 8317

---

## Test 3: Smart Solver

**Purpose:** Test multi-agent problem solving.

1. Click **Smart Solver** in sidebar
2. Select knowledge base
3. Enter a complex question that requires reasoning
4. Submit and watch the agent steps

**Expected:** Step-by-step solving with tool calls visible.

---

## Test 4: Question Generator

**Purpose:** Test auto-question generation from content.

1. Click **Question Generator** in sidebar
2. Select knowledge base
3. Enter a topic/knowledge point
4. Select difficulty and question type
5. Generate

**Expected:** Generated question with answer and explanation.

---

## Test 5: Settings Verification

**Purpose:** Confirm config is loaded correctly.

1. Click **Settings** (bottom of sidebar)
2. Check:
   - LLM shows `gemini-3-flash-preview`
   - Embedding shows `qwen3_vl` / `Qwen3-VL-Embedding-8B`

---

## Quick Smoke Test Order

1. Settings (verify config)
2. Knowledge Base upload (small PDF)
3. RAG query (ask about PDF)

If these 3 pass, core functionality works.

---

## Troubleshooting

### "Embedding failed" or slow first query
- First embedding call downloads ~17GB model (one-time)
- Subsequent calls use cached model

### "LLM not responding"
- Verify CLI Proxy: `curl http://localhost:8317/v1/models -H "Authorization: Bearer sk-proxy"`

### "Knowledge base not found"
- Check backend logs: `tail -f` the backend output file

### Backend logs location
```bash
tail -50 /var/folders/mc/qjwd1ld97_bfhl86xpbfrpp00000gn/T/claude/-Users-kyin/tasks/b6356bd.output
```

### Frontend logs location
```bash
tail -50 /var/folders/mc/qjwd1ld97_bfhl86xpbfrpp00000gn/T/claude/-Users-kyin/tasks/b4509c5.output
```
