"""
Dependency Injection (DI)
=========================

Centralized container for managing service lifecycles and dependencies.
"""

from .container import Container, get_container, set_container

__all__ = ["Container", "get_container", "set_container"]

