---
title: Quickstart
description: Get praDeep running in 5 minutes
---

# Quickstart

Get praDeep running in 5 minutes with this quickstart guide.

## Step 1: Configure Environment

After installation, configure your environment variables:

```bash
# Required: Set your LLM provider
export OPENAI_API_KEY="your-api-key"

# Or use local models (see Configuration for details)
export USE_LOCAL_MODELS=true
```

## Step 2: Start the Server

::: warning IMPORTANT
You **must** activate the virtual environment before running any commands.
:::

```bash
# Activate the virtual environment (REQUIRED)
source .venv/bin/activate

# Start the development server
python scripts/start_web.py

# Or with Docker
docker-compose up
```

## Step 3: Access the Interface

Once the server is running, open your browser:

- **Frontend**: [http://localhost:3783](http://localhost:3783)
- **Backend API Docs**: [http://localhost:8783/docs](http://localhost:8783/docs)

The frontend runs on port **3783** and the backend API runs on port **8783**.

## Step 4: Upload Your First Document

1. Click the **Upload** button in the sidebar
2. Select a PDF, DOCX, or text file
3. Wait for processing to complete
4. Start asking questions!

## Example Interactions

### Basic Question
```
User: What are the main concepts in chapter 3?
praDeep: Based on the document, the main concepts in chapter 3 include...
```

### Generate Practice Questions
```
User: Create 5 practice questions from this material
praDeep: Here are 5 practice questions based on your document...
```

### Deep Research Mode
```
User: Research the latest developments in this topic
praDeep: I'll conduct a systematic exploration of this topic...
```

## Next Steps

- [Configuration Guide](../configuration/index.md) - Customize your setup
- [User Guides](../guides/index.md) - Learn advanced features
- [Architecture Overview](../architecture/index.md) - Understand the system
