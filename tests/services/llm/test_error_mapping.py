from src.services.llm.error_mapping import map_error
from src.services.llm.exceptions import ProviderContextWindowError


def test_maps_context_length_exceeded() -> None:
    err = Exception("context_length_exceeded")
    mapped = map_error(err, provider="test")
    assert isinstance(mapped, ProviderContextWindowError)


def test_maps_too_many_tokens() -> None:
    err = Exception("Too many tokens")
    mapped = map_error(err, provider="test")
    assert isinstance(mapped, ProviderContextWindowError)


def test_non_context_error_not_mapped() -> None:
    err = Exception("something else")
    mapped = map_error(err, provider="test")
    assert not isinstance(mapped, ProviderContextWindowError)
