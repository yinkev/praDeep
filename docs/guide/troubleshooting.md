# Troubleshooting

Quick solutions for common issues.

## Startup Issues

| Problem | Solution |
|:--------|:---------|
| Backend fails to start | Check Python ≥ 3.10, verify `.env` config |
| `npm: command not found` | Install Node.js: `conda install -c conda-forge nodejs` |
| Port already in use | Run `./scripts/stop` (kills 8783 + 3783), or `lsof -i :8783` → `kill -9 <PID>` |

## Connection Issues

| Problem | Solution |
|:--------|:---------|
| Frontend can't reach backend | Verify backend at http://localhost:8783/docs |
| WebSocket fails | Check firewall, confirm `ws://localhost:8783/api/v1/...` format |
| Remote access fails | Set `NEXT_PUBLIC_API_BASE=http://your-ip:8783` in `.env` |

## Docker Issues

| Problem | Solution |
|:--------|:---------|
| Cloud frontend won't connect | Set `NEXT_PUBLIC_API_BASE_EXTERNAL=https://your-server:8783` |
| Wrong architecture | Check with `uname -m`: use `:latest` (AMD64) or `:latest-arm64` (ARM) |

## Knowledge Base

| Problem | Solution |
|:--------|:---------|
| Processing stuck | Check terminal logs, verify API keys |
| `uvloop.Loop` error | Run: `./scripts/extract_numbered_items.sh <kb_name>` |

## Kill Background Processes

```bash
# Recommended (kills backend + frontend):
./scripts/stop

# macOS/Linux
lsof -i :8783 && kill -9 <PID>

# Windows
netstat -ano | findstr :8783
taskkill /PID <PID> /F
```

---

📖 **Full FAQ**: [GitHub README](https://github.com/HKUDS/praDeep#-faq)
