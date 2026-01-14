import importlib.util
import sys
import types


def _install_lightrag_stub() -> None:
    # Prefer the real package when available (prevents breaking imports that
    # rely on lightrag being a proper package, e.g. lightrag.utils).
    if importlib.util.find_spec("lightrag") is not None:
        return

    if "lightrag" in sys.modules:
        return

    lightrag_module = types.ModuleType("lightrag")
    llm_module = types.ModuleType("lightrag.llm")
    openai_module = types.ModuleType("lightrag.llm.openai")

    async def openai_complete_if_cache(*args, **kwargs):
        return "stubbed-lightrag"

    openai_module.openai_complete_if_cache = openai_complete_if_cache
    llm_module.openai = openai_module
    lightrag_module.llm = llm_module

    sys.modules["lightrag"] = lightrag_module
    sys.modules["lightrag.llm"] = llm_module
    sys.modules["lightrag.llm.openai"] = openai_module


_install_lightrag_stub()
