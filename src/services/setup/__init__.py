"""
Setup Service
=============

System setup and initialization for praDeep.

Port configuration is done via .env file:
    BACKEND_PORT=8783   (default: 8783)
    FRONTEND_PORT=3783  (default: 3783)

Usage:
    from src.services.setup import init_user_directories, get_backend_port

    # Initialize user directories
    init_user_directories()

    # Get server ports (from .env)
    backend_port = get_backend_port()
    frontend_port = get_frontend_port()
"""

from .init import (
    get_backend_port,
    get_frontend_port,
    get_ports,
    init_user_directories,
)

__all__ = [
    "init_user_directories",
    "get_backend_port",
    "get_frontend_port",
    "get_ports",
]
