from __future__ import annotations

import asyncio
import json
import re
import time
import uuid
from typing import Any

from src.di import Container, get_container
from src.logging import estimate_tokens, get_logger
from src.services.llm import complete as llm_complete
from src.services.llm import get_llm_config, get_token_limit_kwargs
from src.services.prompt import PromptManager

from .config import CouncilConfig
from .types import CouncilCall, CouncilFinal, CouncilReviewParsed, CouncilRound, CouncilRun


class CouncilOrchestrator:
    """
    Runs a multi-model council workflow for higher-accuracy outputs.

    This class is purposely thin and depends on:
    - An OpenAI-compatible LLM endpoint (e.g. CLI Proxy API at localhost:8317/v1)
    - The prompt texts in src/agents/chat/prompts/<lang>/council.yaml
    """

    def __init__(
        self,
        council_config: CouncilConfig,
        *,
        container: Container | None = None,
        prompt_manager: PromptManager | None = None,
    ) -> None:
        self.council_config = council_config
        self.container = container or get_container()
        self.prompt_manager = prompt_manager or self.container.prompt_manager()
        self.logger = get_logger("CouncilOrchestrator")

        llm_cfg = get_llm_config()
        self.base_url = llm_cfg.base_url
        self.api_key = llm_cfg.api_key
        self.binding = llm_cfg.binding or "openai"

    # ---------------------------------------------------------------------
    # Public API
    # ---------------------------------------------------------------------

    async def run_chat_verify(
        self,
        *,
        question: str,
        chat_messages: list[dict[str, str]],
        context: str,
        sources: dict[str, Any],
        kb_name: str | None,
        enable_rag: bool,
        enable_web_search: bool,
        language: str = "en",
        existing_answer: str | None = None,
    ) -> CouncilRun:
        """
        Verify a chat answer using the council.

        Args:
            question: The user question being verified.
            chat_messages: Full chat messages array (OpenAI format) to preserve multi-turn context.
            context: Retrieved context string (RAG/web already merged).
            sources: Source metadata (rag/web) for UI.
            existing_answer: Optional baseline answer to compare against (original assistant response).
        """
        council_id = f"council_{int(time.time() * 1000)}_{uuid.uuid4().hex[:8]}"
        started_at = time.time()

        run = CouncilRun(
            council_id=council_id,
            created_at=started_at,
            task="chat_verify",
            question=question,
            kb_name=kb_name,
            enable_rag=enable_rag,
            enable_web_search=enable_web_search,
            models={
                "chairman": self.council_config.models.chairman,
                "reviewer": self.council_config.models.reviewer,
                "members": self.council_config.models.members,
            },
            budgets=self.council_config.budgets.__dict__,
            context_excerpt=(context or "")[:4000],
            sources=sources or {},
        )

        if not self.council_config.enabled:
            run.status = "error"
            run.errors.append("Council is disabled by configuration.")
            return run

        prompts = self.prompt_manager.load_prompts(
            module_name="chat", agent_name="council", language=language
        )
        member_instructions = self._get_prompt(
            prompts,
            key="member_instructions",
            fallback=_DEFAULT_MEMBER_INSTRUCTIONS,
        )
        reviewer_instructions = self._get_prompt(
            prompts,
            key="reviewer_instructions",
            fallback=_DEFAULT_REVIEWER_INSTRUCTIONS,
        )
        chairman_instructions = self._get_prompt(
            prompts,
            key="chairman_instructions",
            fallback=_DEFAULT_CHAIRMAN_INSTRUCTIONS,
        )

        budgets = self.council_config.budgets

        rounds: list[CouncilRound] = []
        current_member_outputs: dict[str, str] = {}
        cross_exam_questions: list[str] = []
        reviewer_notes_for_chairman = ""

        # The council is bounded by wall-clock time, not just round count.
        deadline = time.monotonic() + max(5.0, budgets.max_seconds_total)

        for round_index in range(1, max(1, budgets.max_rounds) + 1):
            if time.monotonic() > deadline:
                run.errors.append("Council timed out before completing all rounds.")
                break

            council_round = CouncilRound(round_index=round_index)

            if round_index == 1:
                self.logger.info(
                    f"[{council_id}] Council round 1: member drafts ({len(self.council_config.models.members)})"
                )
                member_calls = await self._run_member_drafts(
                    base_chat_messages=chat_messages,
                    member_models=self.council_config.models.members,
                    member_instructions=member_instructions,
                    max_tokens=budgets.member_max_tokens,
                    temperature=budgets.member_temperature,
                )
                council_round.member_answers = member_calls
                current_member_outputs = {
                    call.model: call.content for call in member_calls if call.content
                }
            else:
                self.logger.info(f"[{council_id}] Council round {round_index}: cross-exam")
                if not cross_exam_questions:
                    break
                cross_exam_calls = await self._run_cross_exam(
                    base_chat_messages=chat_messages,
                    member_models=self.council_config.models.members,
                    member_instructions=member_instructions,
                    questions=cross_exam_questions,
                    max_tokens=budgets.cross_exam_max_tokens,
                    temperature=budgets.member_temperature,
                )
                council_round.cross_exam_questions = cross_exam_questions
                council_round.cross_exam_answers = cross_exam_calls
                # Treat the latest cross-exam revisions as the active member outputs.
                current_member_outputs = {
                    call.model: call.content for call in cross_exam_calls if call.content
                }

            if time.monotonic() > deadline:
                run.errors.append("Council timed out before review.")
                rounds.append(council_round)
                break

            # Reviewer: compare member outputs and propose next questions.
            reviewer_call, parsed = await self._run_reviewer(
                base_chat_messages=chat_messages,
                reviewer_model=self.council_config.models.reviewer,
                reviewer_instructions=reviewer_instructions,
                member_outputs=current_member_outputs,
                existing_answer=existing_answer,
                max_tokens=budgets.reviewer_max_tokens,
                temperature=budgets.reviewer_temperature,
            )
            council_round.review = reviewer_call
            council_round.review_parsed = parsed
            reviewer_notes_for_chairman = parsed.notes_for_chairman or reviewer_notes_for_chairman

            rounds.append(council_round)

            # Decide whether to continue cross-exam.
            if parsed.resolved:
                break

            # If the reviewer provided questions, use them (bounded by budget).
            questions = parsed.cross_exam_questions or []
            if not questions:
                break

            cross_exam_questions = questions[: max(1, budgets.max_cross_exam_questions_per_round)]

        run.rounds = rounds

        # Chairman synthesis (non-streaming; chat websocket may stream it separately)
        final = await self._run_chairman(
            base_chat_messages=chat_messages,
            chairman_model=self.council_config.models.chairman,
            chairman_instructions=chairman_instructions,
            member_outputs=current_member_outputs,
            reviewer_notes=reviewer_notes_for_chairman,
            existing_answer=existing_answer,
            max_tokens=budgets.chairman_max_tokens,
            temperature=budgets.chairman_temperature,
        )
        run.final = final

        if run.errors:
            run.status = "partial" if final.content else "error"

        return run

    async def run_question_validate(
        self,
        *,
        validation_prompt: str,
        question_text: str,
        validation_knowledge: str,
        kb_name: str | None,
        language: str = "en",
    ) -> CouncilRun:
        """
        Validate a generated question using a council workflow.

        The final output (run.final.content) is expected to be a JSON object string:
          { "decision": "...", "issues": [...], "suggestions": [...], "reasoning": "..." }
        """
        council_id = f"council_{int(time.time() * 1000)}_{uuid.uuid4().hex[:8]}"
        started_at = time.time()

        run = CouncilRun(
            council_id=council_id,
            created_at=started_at,
            task="question_validate",
            question=question_text,
            kb_name=kb_name,
            enable_rag=True,  # Validation is always RAG-grounded (knowledge is provided explicitly)
            enable_web_search=False,
            models={
                "chairman": self.council_config.models.chairman,
                "reviewer": self.council_config.models.reviewer,
                "members": self.council_config.models.members,
            },
            budgets=self.council_config.budgets.__dict__,
            context_excerpt=(validation_knowledge or "")[:4000],
            sources={},
        )

        if not self.council_config.enabled:
            run.status = "error"
            run.errors.append("Council is disabled by configuration.")
            return run

        prompts = self.prompt_manager.load_prompts(
            module_name="question", agent_name="council_validation", language=language
        )
        member_instructions = self._get_prompt(
            prompts,
            key="member_instructions",
            fallback=_DEFAULT_QV_MEMBER_INSTRUCTIONS,
        )
        reviewer_instructions = self._get_prompt(
            prompts,
            key="reviewer_instructions",
            fallback=_DEFAULT_QV_REVIEWER_INSTRUCTIONS,
        )
        chairman_instructions = self._get_prompt(
            prompts,
            key="chairman_instructions",
            fallback=_DEFAULT_QV_CHAIRMAN_INSTRUCTIONS,
        )
        cross_exam_template = self._get_prompt(
            prompts,
            key="cross_exam_user_template",
            fallback=_DEFAULT_QV_CROSS_EXAM_TEMPLATE,
        )
        chairman_template = self._get_prompt(
            prompts,
            key="chairman_user_template",
            fallback=_DEFAULT_QV_CHAIRMAN_TEMPLATE,
        )

        budgets = self.council_config.budgets
        deadline = time.monotonic() + max(5.0, budgets.max_seconds_total)

        base_messages = [
            {
                "role": "system",
                "content": "You are a professional question validation expert. "
                "Validate strictly against the provided validation knowledge. "
                "Output strict JSON only.",
            },
            {"role": "user", "content": validation_prompt},
        ]

        # Round 1: member validations (parallel)
        member_calls = await self._run_member_drafts(
            base_chat_messages=base_messages,
            member_models=self.council_config.models.members,
            member_instructions=member_instructions,
            max_tokens=budgets.member_max_tokens,
            temperature=budgets.member_temperature,
        )
        round_1 = CouncilRound(round_index=1, member_answers=member_calls)

        member_outputs = {c.model: c.content for c in member_calls if c.content}

        if time.monotonic() > deadline:
            run.errors.append("Council timed out before reviewer.")
            run.rounds = [round_1]
            run.status = "partial"
            return run

        # Reviewer: compare validators and propose cross-exam questions.
        reviewer_user_prompt = self._build_qv_reviewer_user_prompt(member_outputs)
        reviewer_messages = self._with_system_addendum(base_messages, reviewer_instructions)
        reviewer_messages = self._append_user_message(reviewer_messages, reviewer_user_prompt)
        reviewer_call = await self._call_complete(
            role="reviewer",
            model=self.council_config.models.reviewer,
            messages=reviewer_messages,
            max_tokens=budgets.reviewer_max_tokens,
            temperature=budgets.reviewer_temperature,
        )
        review_parsed = self._parse_reviewer_output(reviewer_call.content)
        round_1.review = reviewer_call
        round_1.review_parsed = review_parsed

        rounds: list[CouncilRound] = [round_1]

        # Optional cross-exam (bounded by budgets)
        cross_exam_questions = (review_parsed.cross_exam_questions or [])[
            : max(1, budgets.max_cross_exam_questions_per_round)
        ]
        if cross_exam_questions and time.monotonic() <= deadline and budgets.max_rounds >= 2:
            cross_exam_prompt = cross_exam_template.format(
                questions="\n".join(f"{i}. {q}" for i, q in enumerate(cross_exam_questions, start=1))
            )
            cross_exam_calls = await self._run_cross_exam_with_prompt(
                base_chat_messages=base_messages,
                member_models=self.council_config.models.members,
                member_instructions=member_instructions,
                user_prompt=cross_exam_prompt,
                max_tokens=budgets.cross_exam_max_tokens,
                temperature=budgets.member_temperature,
            )
            round_2 = CouncilRound(
                round_index=2,
                cross_exam_questions=cross_exam_questions,
                cross_exam_answers=cross_exam_calls,
            )
            rounds.append(round_2)

            # Use revised validations (cross-exam outputs) as the latest member outputs.
            member_outputs = {c.model: c.content for c in cross_exam_calls if c.content}

        run.rounds = rounds

        if time.monotonic() > deadline:
            run.errors.append("Council timed out before chairman.")
            run.status = "partial"
            return run

        # Chairman: final decision JSON
        chairman_user_prompt = chairman_template.format(
            member_outputs=self._format_member_outputs(member_outputs),
            reviewer_notes=(review_parsed.notes_for_chairman or "").strip(),
        )
        chairman_messages = self._with_system_addendum(base_messages, chairman_instructions)
        chairman_messages = self._append_user_message(chairman_messages, chairman_user_prompt)
        chairman_call = await self._call_complete(
            role="chairman",
            model=self.council_config.models.chairman,
            messages=chairman_messages,
            max_tokens=budgets.chairman_max_tokens,
            temperature=budgets.chairman_temperature,
        )

        run.final = CouncilFinal(
            model=self.council_config.models.chairman,
            content=chairman_call.content,
            duration_s=chairman_call.duration_s,
            estimated_prompt_tokens=chairman_call.estimated_prompt_tokens,
            estimated_completion_tokens=chairman_call.estimated_completion_tokens,
        )

        if run.errors:
            run.status = "partial"

        return run

    # ---------------------------------------------------------------------
    # Phases
    # ---------------------------------------------------------------------

    async def _run_member_drafts(
        self,
        *,
        base_chat_messages: list[dict[str, str]],
        member_models: list[str],
        member_instructions: str,
        max_tokens: int,
        temperature: float,
    ) -> list[CouncilCall]:
        async def one(model: str) -> CouncilCall:
            messages = self._with_system_addendum(base_chat_messages, member_instructions)
            return await self._call_complete(
                role="member",
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
            )

        results = await asyncio.gather(*(one(m) for m in member_models), return_exceptions=True)
        calls: list[CouncilCall] = []
        for model, result in zip(member_models, results, strict=False):
            if isinstance(result, Exception):
                calls.append(CouncilCall(role="member", model=model, error=str(result)))
            else:
                calls.append(result)
        return calls

    async def _run_reviewer(
        self,
        *,
        base_chat_messages: list[dict[str, str]],
        reviewer_model: str,
        reviewer_instructions: str,
        member_outputs: dict[str, str],
        existing_answer: str | None,
        max_tokens: int,
        temperature: float,
    ) -> tuple[CouncilCall, CouncilReviewParsed]:
        user_prompt = self._build_reviewer_user_prompt(member_outputs, existing_answer)
        messages = self._with_system_addendum(base_chat_messages, reviewer_instructions)
        messages = self._append_user_message(messages, user_prompt)

        call = await self._call_complete(
            role="reviewer",
            model=reviewer_model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        parsed = self._parse_reviewer_output(call.content)
        return call, parsed

    async def _run_cross_exam(
        self,
        *,
        base_chat_messages: list[dict[str, str]],
        member_models: list[str],
        member_instructions: str,
        questions: list[str],
        max_tokens: int,
        temperature: float,
    ) -> list[CouncilCall]:
        cross_exam_prompt = self._build_cross_exam_user_prompt(questions)

        async def one(model: str) -> CouncilCall:
            messages = self._with_system_addendum(base_chat_messages, member_instructions)
            messages = self._append_user_message(messages, cross_exam_prompt)
            return await self._call_complete(
                role="member",
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
            )

        results = await asyncio.gather(*(one(m) for m in member_models), return_exceptions=True)
        calls: list[CouncilCall] = []
        for model, result in zip(member_models, results, strict=False):
            if isinstance(result, Exception):
                calls.append(CouncilCall(role="member", model=model, error=str(result)))
            else:
                calls.append(result)
        return calls

    async def _run_chairman(
        self,
        *,
        base_chat_messages: list[dict[str, str]],
        chairman_model: str,
        chairman_instructions: str,
        member_outputs: dict[str, str],
        reviewer_notes: str,
        existing_answer: str | None,
        max_tokens: int,
        temperature: float,
    ) -> CouncilFinal:
        user_prompt = self._build_chairman_user_prompt(
            member_outputs=member_outputs,
            reviewer_notes=reviewer_notes,
            existing_answer=existing_answer,
        )
        messages = self._with_system_addendum(base_chat_messages, chairman_instructions)
        messages = self._append_user_message(messages, user_prompt)

        call = await self._call_complete(
            role="chairman",
            model=chairman_model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        return CouncilFinal(
            model=chairman_model,
            content=call.content,
            duration_s=call.duration_s,
            estimated_prompt_tokens=call.estimated_prompt_tokens,
            estimated_completion_tokens=call.estimated_completion_tokens,
        )

    # ---------------------------------------------------------------------
    # LLM I/O helpers
    # ---------------------------------------------------------------------

    async def _call_complete(
        self,
        *,
        role: str,
        model: str,
        messages: list[dict[str, str]],
        max_tokens: int,
        temperature: float,
    ) -> CouncilCall:
        start = time.monotonic()
        prompt_text = "\n".join((m.get("role", "") + ": " + m.get("content", "")) for m in messages)
        estimated_prompt_tokens = estimate_tokens(prompt_text)

        kwargs: dict[str, Any] = {"temperature": temperature}
        if max_tokens:
            kwargs.update(get_token_limit_kwargs(model, max_tokens))

        try:
            content = await llm_complete(
                prompt="",
                system_prompt="",
                model=model,
                api_key=self.api_key,
                base_url=self.base_url,
                binding=self.binding,
                messages=messages,
                **kwargs,
            )
            duration = time.monotonic() - start
            return CouncilCall(
                role=role,  # type: ignore[arg-type]
                model=model,
                content=content or "",
                duration_s=duration,
                estimated_prompt_tokens=estimated_prompt_tokens,
                estimated_completion_tokens=estimate_tokens(content or ""),
            )
        except Exception as e:
            duration = time.monotonic() - start
            return CouncilCall(
                role=role,  # type: ignore[arg-type]
                model=model,
                content="",
                error=str(e),
                duration_s=duration,
                estimated_prompt_tokens=estimated_prompt_tokens,
                estimated_completion_tokens=0,
            )

    # ---------------------------------------------------------------------
    # Prompt building
    # ---------------------------------------------------------------------

    @staticmethod
    def _get_prompt(prompts: dict[str, Any], *, key: str, fallback: str) -> str:
        value = prompts.get(key)
        return value if isinstance(value, str) and value.strip() else fallback

    @staticmethod
    def _with_system_addendum(
        base_chat_messages: list[dict[str, str]], addendum: str
    ) -> list[dict[str, str]]:
        """
        Return a new messages array with addendum appended to the first system prompt.

        Assumes base_chat_messages already start with a system message.
        """
        if not base_chat_messages:
            return [{"role": "system", "content": addendum}]

        out = [m.copy() for m in base_chat_messages]
        first = out[0]
        if first.get("role") == "system":
            first["content"] = (first.get("content") or "").rstrip() + "\n\n" + addendum
            out[0] = first
            return out

        return [{"role": "system", "content": addendum}, *out]

    @staticmethod
    def _append_user_message(messages: list[dict[str, str]], content: str) -> list[dict[str, str]]:
        out = [m.copy() for m in messages]
        out.append({"role": "user", "content": content})
        return out

    @staticmethod
    def _build_reviewer_user_prompt(
        member_outputs: dict[str, str],
        existing_answer: str | None,
    ) -> str:
        # Anonymize model identities to reduce "brand bias" during review.
        members = list(member_outputs.items())
        blocks: list[str] = []
        for idx, (_, content) in enumerate(members, start=1):
            blocks.append(f"### Member {idx}\n{content}".strip())

        baseline = ""
        if existing_answer and existing_answer.strip():
            baseline = f"\n\n### Baseline (original assistant answer)\n{existing_answer.strip()}"

        return (
            "Review the member answers below against the provided context.\n"
            "Return STRICT JSON with keys: resolved (bool), issues (string[]), disagreements (string[]), "
            "cross_exam_questions (string[]), notes_for_chairman (string).\n"
            "Rules:\n"
            "- If the context does not support a claim, flag it.\n"
            "- cross_exam_questions should be ordered by expected information gain.\n"
            "- If nothing important is unresolved, set resolved=true and cross_exam_questions=[].\n"
            "\n\n"
            + "\n\n".join(blocks)
            + baseline
        )

    @staticmethod
    def _build_cross_exam_user_prompt(questions: list[str]) -> str:
        lines = "\n".join(f"{i}. {q}" for i, q in enumerate(questions, start=1))
        return (
            "Cross-exam questions from the reviewer:\n"
            f"{lines}\n\n"
            "Answer each question briefly, then provide a revised final answer.\n"
            "If the provided context does not support an answer, say so explicitly.\n"
        )

    @staticmethod
    def _build_chairman_user_prompt(
        *,
        member_outputs: dict[str, str],
        reviewer_notes: str,
        existing_answer: str | None,
    ) -> str:
        members = list(member_outputs.values())
        blocks = "\n\n".join(
            f"### Member {i}\n{content}".strip() for i, content in enumerate(members, start=1)
        )
        baseline = ""
        if existing_answer and existing_answer.strip():
            baseline = f"\n\n### Baseline (original assistant answer)\n{existing_answer.strip()}"

        notes = reviewer_notes.strip()
        notes_block = f"\n\n### Reviewer notes\n{notes}" if notes else ""

        return (
            "Synthesize the most accurate answer using the provided context and the council inputs.\n"
            "Output format:\n"
            "1) Final answer (clear, concise)\n"
            "2) What is NOT supported by the provided context (if anything)\n"
            "\n\n"
            + blocks
            + notes_block
            + baseline
        )

    # ---------------------------------------------------------------------
    # Parsing
    # ---------------------------------------------------------------------

    def _parse_reviewer_output(self, text: str) -> CouncilReviewParsed:
        if not text or not text.strip():
            return CouncilReviewParsed()

        parsed = self._try_parse_json_object(text)
        if isinstance(parsed, dict):
            try:
                return CouncilReviewParsed(**parsed)
            except Exception:
                pass

        # Best-effort fallback: extract numbered questions.
        questions: list[str] = []
        for line in text.splitlines():
            m = re.match(r"^\\s*(?:\\d+\\.|[-*])\\s+(.*)$", line.strip())
            if m:
                q = m.group(1).strip()
                if q and "?" in q:
                    questions.append(q)

        return CouncilReviewParsed(
            resolved=False,
            issues=[],
            disagreements=[],
            cross_exam_questions=questions,
            notes_for_chairman="",
        )

    @staticmethod
    def _try_parse_json_object(text: str) -> dict[str, Any] | None:
        """
        Extract and parse the first JSON object found in the text.
        Supports raw JSON or ```json fenced blocks.
        """
        fenced = re.search(r"```json\\s*(\\{.*?\\})\\s*```", text, flags=re.DOTALL | re.IGNORECASE)
        if fenced:
            candidate = fenced.group(1)
            try:
                return json.loads(candidate)
            except Exception:
                return None

        # Try the first {...} span.
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            candidate = text[start : end + 1]
            try:
                return json.loads(candidate)
            except Exception:
                return None
        return None

    @staticmethod
    def _build_qv_reviewer_user_prompt(member_outputs: dict[str, str]) -> str:
        members = list(member_outputs.items())
        blocks: list[str] = []
        for idx, (_, content) in enumerate(members, start=1):
            blocks.append(f"### Validator {idx}\n{content}".strip())

        return (
            "Review the validator JSON outputs below.\n"
            "Return STRICT JSON with keys: resolved (bool), issues (string[]), disagreements (string[]), "
            "cross_exam_questions (string[]), notes_for_chairman (string).\n"
            "Rules:\n"
            "- If validators disagree on decision or key issues, propose cross_exam_questions.\n"
            "- cross_exam_questions should be ordered by expected information gain.\n"
            "- If nothing important is unresolved, set resolved=true and cross_exam_questions=[].\n"
            "\n\n"
            + "\n\n".join(blocks)
        )

    async def _run_cross_exam_with_prompt(
        self,
        *,
        base_chat_messages: list[dict[str, str]],
        member_models: list[str],
        member_instructions: str,
        user_prompt: str,
        max_tokens: int,
        temperature: float,
    ) -> list[CouncilCall]:
        async def one(model: str) -> CouncilCall:
            messages = self._with_system_addendum(base_chat_messages, member_instructions)
            messages = self._append_user_message(messages, user_prompt)
            return await self._call_complete(
                role="member",
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
            )

        results = await asyncio.gather(*(one(m) for m in member_models), return_exceptions=True)
        calls: list[CouncilCall] = []
        for model, result in zip(member_models, results, strict=False):
            if isinstance(result, Exception):
                calls.append(CouncilCall(role="member", model=model, error=str(result)))
            else:
                calls.append(result)
        return calls

    @staticmethod
    def _format_member_outputs(member_outputs: dict[str, str]) -> str:
        members = list(member_outputs.values())
        return "\n\n".join(
            f"### Validator {i}\n{content}".strip() for i, content in enumerate(members, start=1)
        )


_DEFAULT_MEMBER_INSTRUCTIONS = """\
[Council Member]
You are a Council Member. Your job is to answer ONLY from the provided reference context in the chat.

Rules:
- If a claim is not supported by the provided context, say: "Not supported by provided context."
- If you are unsure, say so explicitly.
- Prefer correctness over completeness.
- Be concise, but include the key reasoning steps.
"""

_DEFAULT_REVIEWER_INSTRUCTIONS = """\
[Council Reviewer]
You are a Council Reviewer. Your job is to check the member answers against the provided context,
identify unsupported claims, and produce cross-exam questions that resolve disagreements.

Return STRICT JSON only (no commentary outside JSON).
"""

_DEFAULT_CHAIRMAN_INSTRUCTIONS = """\
[Council Chairman]
You are the Council Chairman. Your job is to synthesize the final answer grounded in the provided context.
If something is not supported by the provided context, say so.
"""

_DEFAULT_QV_MEMBER_INSTRUCTIONS = """\
[Question Validation - Council Member]
You validate a generated question ONLY against the provided validation knowledge.

Output strict JSON only:
{
  "decision": "approve" | "request_modification" | "request_regeneration",
  "issues": ["..."],
  "suggestions": ["..."],
  "reasoning": "..."
}
"""

_DEFAULT_QV_REVIEWER_INSTRUCTIONS = """\
[Question Validation - Council Reviewer]
You compare multiple validator JSON outputs and identify disagreements.
Return STRICT JSON only with keys:
resolved, issues, disagreements, cross_exam_questions, notes_for_chairman.
"""

_DEFAULT_QV_CHAIRMAN_INSTRUCTIONS = """\
[Question Validation - Council Chairman]
You must output the final validation decision as strict JSON only:
{
  "decision": "...",
  "issues": [...],
  "suggestions": [...],
  "reasoning": "..."
}
"""

_DEFAULT_QV_CROSS_EXAM_TEMPLATE = """\
Cross-exam questions from the reviewer:
{questions}

Answer each question briefly, then output a revised FINAL validation JSON object only.
"""

_DEFAULT_QV_CHAIRMAN_TEMPLATE = """\
Synthesize a single FINAL validation JSON decision using the validator outputs and reviewer notes.

Validator outputs:
{member_outputs}

Reviewer notes:
{reviewer_notes}

Output strict JSON only:
{
  "decision": "approve" | "request_modification" | "request_regeneration",
  "issues": ["..."],
  "suggestions": ["..."],
  "reasoning": "..."
}
"""
