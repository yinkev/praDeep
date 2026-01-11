# IdeaGen Context Fix - Implementation Summary

## Status: VERIFIED ✅

**Servers Running:**
- Backend (FastAPI): Port 3007 ✓
- Frontend (Next.js): Port 3008 ✓

---

## Problem Statement

The Ideation tool was generating research ideas without understanding the project context. Users reported:
- "It doesn't know what my project is about"
- Generated ideas were generic and not aligned with research goals
- The tool couldn't differentiate between different research domains
- No way to provide overall research direction

---

## Solution Overview

We implemented a comprehensive context-aware system that allows the Ideation tool to understand:
1. **Notebook Metadata**: Name and description from the notebook
2. **Project Goal**: User-provided research objective/learning goal
3. **Selected Records**: The specific materials chosen for ideation

This context is passed through the entire pipeline and injected into the LLM prompt.

---

## Implementation Details

### 1. Frontend Changes (`web/app/ideagen/page.tsx`)

**New UI Component: Research Goal Input**
- **Location**: Lines 497-513
- **Purpose**: Capture user's overall research objective
- **Features**:
  - Textarea input with placeholder guidance
  - Labeled as "Research Goal (Optional)"
  - Visual styling with amber/brain icon
  - Helpful tip explaining its importance

```typescript
// State variable
const [projectGoal, setProjectGoal] = useState('')

// UI Component (lines 497-513)
<textarea
  value={projectGoal}
  onChange={e => setProjectGoal(e.target.value)}
  placeholder="What is your overall research objective or learning goal?"
  rows={2}
/>
```

**WebSocket Data Transmission**
- **Location**: Lines 233-238
- **What Changed**: Added `project_goal` to WebSocket payload
- **Impact**: Frontend now sends research goal to backend

```typescript
ws.send(
  JSON.stringify({
    records: recordsArray.length > 0 ? recordsArray : undefined,
    user_thoughts: userThoughts.trim() || undefined,
    project_goal: projectGoal.trim() || undefined,  // NEW
  })
)
```

---

### 2. Backend Changes (`src/api/routers/ideagen.py`)

**Request Handling**
- **Location**: Lines 123, 184, 162
- **What Changed**: Extract and pass `project_goal` from WebSocket request

```python
# Line 123: Extract from request
project_goal = data.get("project_goal", "")

# Lines 178-184: Build notebook context (single-notebook mode)
notebook_context = {
    "name": notebook.get("name", ""),
    "description": notebook.get("description", ""),
}
if project_goal:
    notebook_context["project_goal"] = project_goal

# Lines 160-162: Cross-notebook mode
if project_goal:
    notebook_context = {"project_goal": project_goal}
```

**Context Passing to Agent**
- **Location**: Lines 215-216
- **What Changed**: Pass `notebook_context` to MaterialOrganizerAgent

```python
knowledge_points = await organizer.process(
    records,
    user_thoughts if user_thoughts else None,
    notebook_context  # NEW: Pass context
)
```

---

### 3. Agent Changes (`src/agents/ideagen/material_organizer_agent.py`)

**Method Signature Update**
- **Location**: Lines 44-59
- **What Changed**: Added `notebook_context` parameter with proper documentation

```python
async def process(
    self,
    records: list[dict[str, Any]],
    user_thoughts: str | None = None,
    notebook_context: dict[str, Any] | None = None,  # NEW
) -> list[dict[str, Any]]:
    """
    Args:
        notebook_context: Optional notebook metadata containing:
            - name: Notebook name
            - description: Notebook description
            - project_goal: User's overall research goal
    """
```

**Context Extraction and Formatting**
- **Location**: Lines 89-103
- **What Changed**: Build formatted context text from notebook_context dictionary

```python
# Extract context components
context_text = ""
if notebook_context:
    notebook_name = notebook_context.get("name", "")
    notebook_desc = notebook_context.get("description", "")
    project_goal = notebook_context.get("project_goal", "")

    if notebook_name or notebook_desc or project_goal:
        context_text = "\n\n=== PROJECT CONTEXT ===\n"
        if notebook_name:
            context_text += f"Notebook: {notebook_name}\n"
        if notebook_desc:
            context_text += f"Description: {notebook_desc}\n"
        if project_goal:
            context_text += f"Research Goal: {project_goal}\n"
```

**Prompt Injection**
- **Location**: Lines 107-111
- **What Changed**: Inject `context_text` into user prompt template

```python
user_prompt = user_template.format(
    context_text=context_text,  # NEW: Inject context
    materials_text=materials_text,
    user_thoughts_text=user_thoughts_text,
)
```

---

### 4. Prompt Template Changes (`src/agents/ideagen/prompts/en/material_organizer.yaml`)

**System Prompt Enhancement**
- **Location**: Lines 4-9
- **What Changed**: Added explicit instructions to pay attention to PROJECT CONTEXT

```yaml
system: |
  IMPORTANT: Pay close attention to the PROJECT CONTEXT provided at the beginning
  of the user's message. This context describes:
  - The notebook name and purpose
  - The overall research goal or learning objective
  - The domain or subject area being studied

  Use this context to better understand the records and extract knowledge points
  that align with the user's research direction.
```

**Extraction Principles Update**
- **Location**: Lines 21-25
- **What Changed**: Added principle to align with research goal

```yaml
Extraction Principles:
  - Knowledge points should align with the stated research goal or notebook
    purpose when provided
  - Consider how the PROJECT CONTEXT relates to the selected records
```

**User Template Update**
- **Location**: Lines 43-44
- **What Changed**: Template now includes `{context_text}` placeholder

```yaml
user_template: |
  Please analyze the following notebook records and extract relatively
  independent knowledge points:{context_text}

  {materials_text}{user_thoughts_text}
```

---

## Complete Data Flow

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER INPUT (Frontend)                                        │
│    - Selects notebook records                                   │
│    - Enters research goal: "Study cancer immunotherapy"         │
│    - Adds thoughts: "Focus on T-cell mechanisms"                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. WEBSOCKET TRANSMISSION (Frontend → Backend)                  │
│    {                                                             │
│      "records": [...],                                           │
│      "user_thoughts": "Focus on T-cell mechanisms",             │
│      "project_goal": "Study cancer immunotherapy"               │
│    }                                                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. BACKEND REQUEST HANDLING (ideagen.py)                        │
│    - Extracts project_goal from WebSocket data                  │
│    - Fetches notebook metadata (name, description)              │
│    - Builds notebook_context dictionary:                        │
│      {                                                           │
│        "name": "Cancer Immunotherapy Research",                 │
│        "description": "Study of immune system...",              │
│        "project_goal": "Study cancer immunotherapy"             │
│      }                                                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. AGENT INVOCATION (ideagen.py)                                │
│    organizer.process(                                           │
│      records=selected_records,                                  │
│      user_thoughts="Focus on T-cell mechanisms",                │
│      notebook_context=notebook_context                          │
│    )                                                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. CONTEXT FORMATTING (material_organizer_agent.py)             │
│    context_text = """                                           │
│    === PROJECT CONTEXT ===                                      │
│    Notebook: Cancer Immunotherapy Research                      │
│    Description: Study of immune system...                       │
│    Research Goal: Study cancer immunotherapy                    │
│    """                                                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. PROMPT CONSTRUCTION (material_organizer_agent.py)            │
│    user_prompt = template.format(                               │
│      context_text=context_text,        # ← PROJECT CONTEXT      │
│      materials_text=formatted_records,                          │
│      user_thoughts_text=user_thoughts                           │
│    )                                                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. LLM REQUEST                                                   │
│    System: "Pay attention to PROJECT CONTEXT..."                │
│    User: "=== PROJECT CONTEXT ===                               │
│           Notebook: Cancer Immunotherapy Research               │
│           Research Goal: Study cancer immunotherapy             │
│                                                                  │
│           === Record 1 ===                                      │
│           Type: research                                        │
│           Title: T-cell activation pathways                     │
│           ..."                                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. LLM RESPONSE                                                  │
│    Now understands:                                             │
│    - This is about cancer immunotherapy                         │
│    - Focus should be on immune mechanisms                       │
│    - Generates contextually relevant knowledge points           │
└─────────────────────────────────────────────────────────────────┘
```

---

## How It Solves the Problem

### Before the Fix ❌

**LLM Receives:**
```
Record 1: Study of T-cell activation...
Record 2: Checkpoint inhibitor mechanisms...
Record 3: CAR-T therapy overview...
```

**Result:** LLM has no idea this is cancer research, generates generic immunology points

---

### After the Fix ✅

**LLM Receives:**
```
=== PROJECT CONTEXT ===
Notebook: Cancer Immunotherapy Research
Description: Investigating novel immune-based therapies
Research Goal: Study cancer immunotherapy with focus on T-cell engineering

Record 1: Study of T-cell activation...
Record 2: Checkpoint inhibitor mechanisms...
Record 3: CAR-T therapy overview...
```

**Result:** LLM understands:
- Domain: Cancer immunotherapy
- Purpose: Research novel therapies
- Focus: T-cell engineering
- Generates highly relevant, domain-specific research ideas

---

## User Guide: How to Use the New Feature

### Step 1: Select Your Source Materials (Optional)

Navigate through notebooks and select relevant records that form the foundation of your research.

**Tips:**
- You can select from multiple notebooks (cross-notebook support)
- Select 3-10 records for best results
- Or skip this if you just want to describe your idea in text

---

### Step 2: Provide Research Goal (IMPORTANT - NEW!)

In the **"Research Goal"** text area (amber-colored section), describe:

**Good Examples:**
```
"Exploring the molecular mechanisms of CRISPR-Cas9 gene editing
for therapeutic applications in genetic diseases"

"Investigating machine learning approaches for predicting protein
folding structures with applications to drug discovery"

"Understanding the intersection of quantum computing and
cryptography, focusing on post-quantum security protocols"
```

**What to Include:**
- Your research domain/field
- Overall objective or learning goal
- Any specific focus areas
- Intended application or outcome

**Why It Matters:**
The Research Goal provides critical context that helps the AI:
- Understand your project's domain
- Generate relevant knowledge points
- Align suggestions with your research direction
- Filter out irrelevant ideas

---

### Step 3: Add Your Thoughts (Optional)

Provide additional context, specific questions, or directions you're interested in exploring.

---

### Step 4: Generate Ideas

Click **"Generate Ideas"** and watch as the system:
1. Extracts knowledge points **using your research goal as context**
2. Filters and refines ideas based on relevance
3. Generates detailed research proposals aligned with your objectives

---

## Example Workflow

### Scenario: Cancer Immunotherapy Research

**Research Goal:**
```
"Study cancer immunotherapy approaches with focus on T-cell
engineering and checkpoint inhibitors for solid tumors"
```

**Selected Records:**
- "T-cell receptor engineering techniques"
- "PD-1/PD-L1 checkpoint pathways"
- "Tumor microenvironment immunosuppression"

**User Thoughts:**
```
"Interested in combination therapies that enhance T-cell
infiltration into solid tumors"
```

**Generated Ideas (Sample):**
1. **Knowledge Point:** "CAR-T Cell Persistence in Solid Tumor Microenvironments"
   - **Description:** Investigates engineering strategies to improve CAR-T cell survival in immunosuppressive tumor environments
   - **Research Ideas:**
     - Combining checkpoint inhibition with CAR-T therapy
     - Engineering cytokine-secreting CAR-T cells
     - Targeting tumor stromal cells to improve T-cell infiltration

---

## Technical Benefits

### 1. Context Propagation
- Context flows from frontend → backend → agent → LLM
- No information loss at any stage

### 2. Flexible Context Sources
- Single notebook: Uses notebook name + description + goal
- Cross-notebook: Uses project goal
- Text-only mode: Uses project goal

### 3. Backward Compatibility
- `notebook_context` parameter is optional
- System works with or without research goal
- Existing notebooks without metadata still function

### 4. Prompt Engineering
- Context appears at the top of the prompt (high attention)
- Clearly marked with "=== PROJECT CONTEXT ===" header
- System prompt explicitly instructs LLM to use context

---

## Verification Checklist

- [x] Frontend has "Research Goal" input field
- [x] Frontend sends `project_goal` via WebSocket
- [x] Backend extracts `project_goal` from request
- [x] Backend builds `notebook_context` dictionary
- [x] Backend passes context to MaterialOrganizerAgent
- [x] Agent accepts `notebook_context` parameter
- [x] Agent extracts and formats context components
- [x] Agent injects context into user prompt
- [x] Prompt template includes `{context_text}` placeholder
- [x] System prompt instructs LLM to use PROJECT CONTEXT
- [x] Servers are running (3007, 3008)

---

## Testing Instructions

### Manual Test

1. **Start Servers** (if not running):
   ```bash
   # Backend
   cd /Users/kyin/Projects/praDeep
   python -m uvicorn src.api.main:app --host 0.0.0.0 --port 3007 --reload

   # Frontend (in new terminal)
   cd /Users/kyin/Projects/praDeep/web
   npm run dev -- -p 3008
   ```

2. **Navigate to IdeaGen**:
   - Open browser: http://localhost:3008/ideagen

3. **Test with Context**:
   - Select 2-3 records from a notebook
   - Enter Research Goal: "Investigating quantum computing algorithms for optimization problems"
   - Enter Thoughts: "Focus on QAOA and VQE"
   - Click "Generate Ideas"

4. **Verify Context Usage**:
   - Check backend logs for context being passed
   - Generated ideas should reference quantum computing
   - Knowledge points should align with optimization focus

5. **Test Text-Only Mode**:
   - Clear all record selections
   - Enter Research Goal: "Studying neural networks for image classification"
   - Enter Thoughts: "Interested in convolutional architectures and transfer learning"
   - Generate ideas should work without records

---

## Known Limitations

1. **No Validation**: Research goal is free-text, no validation or suggestions
2. **No Persistence**: Research goal not saved between sessions (consider adding to notebook metadata?)
3. **Limited Feedback**: User doesn't see how context influenced results (could add explanation)

---

## Future Enhancements

### Short-term
- [ ] Save research goal to notebook metadata
- [ ] Provide example research goals for different domains
- [ ] Character count indicator for research goal field

### Medium-term
- [ ] Show "context influence" indicator per generated idea
- [ ] Suggest research goals based on notebook content
- [ ] Template library for common research domains

### Long-term
- [ ] Multi-language support for prompts
- [ ] Research goal auto-generation from selected records
- [ ] Context-aware idea refinement iterations

---

## Conclusion

The Ideation tool now has full awareness of project context through:
1. Explicit user-provided research goals
2. Notebook metadata (name, description)
3. Proper context propagation through the entire pipeline
4. Enhanced prompts that instruct the LLM to use context

This fix transforms the tool from a generic idea generator into a **context-aware research assistant** that understands and aligns with user objectives.

---

**Last Updated:** 2026-01-11
**Implementation Status:** Complete and Verified
**Servers Status:** Running (Backend: 3007, Frontend: 3008)
